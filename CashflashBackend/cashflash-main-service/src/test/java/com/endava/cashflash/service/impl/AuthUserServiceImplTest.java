package com.endava.cashflash.service.impl;

import com.endava.cashflash.constants.NumericalConstants;
import com.endava.cashflash.dto.request.GetOtpRequest;
import com.endava.cashflash.dto.request.LogInRequest;
import com.endava.cashflash.dto.request.ResetPasswordRequest;
import com.endava.cashflash.dto.request.SetPinRequest;
import com.endava.cashflash.dto.request.VerifyOtpRequest;
import com.endava.cashflash.dto.request.VerifyPinRequest;
import com.endava.cashflash.dto.response.GetOtpResponse;
import com.endava.cashflash.dto.response.LogInResponse;
import com.endava.cashflash.dto.response.ResetPasswordResponse;
import com.endava.cashflash.dto.response.SetPinResponse;
import com.endava.cashflash.dto.response.VerifyOtpResponse;
import com.endava.cashflash.dto.response.VerifyPinResponse;
import com.endava.cashflash.enums.NotificationStatus;
import com.endava.cashflash.enums.UserRole;
import com.endava.cashflash.exception.InvalidCredentialsException;
import com.endava.cashflash.exception.InvalidOtpException;
import com.endava.cashflash.exception.OtpNotVerifiedException;
import com.endava.cashflash.exception.ResourceAlreadyExistsException;
import com.endava.cashflash.model.AuthUser;
import com.endava.cashflash.model.User;
import com.endava.cashflash.repository.AuthUserRepository;
import com.endava.cashflash.service.AuditLogService;
import com.endava.cashflash.service.NotificationService;
import com.endava.cashflash.util.JwtUtil;
import com.endava.cashflash.util.OtpUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthUserServiceImplTest {

    @Mock
    private AuthUserRepository authUserRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private OtpUtil otpUtil;

    @InjectMocks
    private AuthUserServiceImpl authUserService;

    @Test
    void logIn_shouldReturnResponseForValidCredentials() {
        AuthUser authUser = buildAuthUser();
        authUser.setPasswordHash("encoded-password");
        authUser.getUser().setKycDocumentPath("/tmp/kyc.pdf");
        authUser.setPinHash("encoded-pin");

        when(authUserRepository.findByUserEmail("user@mail.com")).thenReturn(Optional.of(authUser));
        when(passwordEncoder.matches("Password@123", "encoded-password")).thenReturn(true);
        when(jwtUtil.generateToken(101L, "user@mail.com", UserRole.USER)).thenReturn("jwt-token");

        LogInResponse response = authUserService.logIn(new LogInRequest("user@mail.com", "Password@123"));

        assertEquals("jwt-token", response.token());
        assertEquals("Akshay Maruti Shet", response.fullName());
        assertTrue(response.isKycCompleted());
        assertTrue(response.isPinSet());

        verify(auditLogService).log(eq(201L), eq("AUTH_USER"), eq("LOG-IN"), isNull(), contains("SUCCESSFUL"));
    }

    @Test
    void logIn_shouldThrowWhenPasswordDoesNotMatch() {
        AuthUser authUser = buildAuthUser();
        authUser.setPasswordHash("encoded-password");

        when(authUserRepository.findByUserEmail("user@mail.com")).thenReturn(Optional.of(authUser));
        when(passwordEncoder.matches("Password@123", "encoded-password")).thenReturn(false);

        assertThrows(
                InvalidCredentialsException.class,
                () -> authUserService.logIn(new LogInRequest("user@mail.com", "Password@123"))
        );

        verifyNoInteractions(jwtUtil, notificationService);
    }

    @Test
    void getOtp_shouldStoreOtpStateAndReturnPlainOtp() {
        AuthUser authUser = buildAuthUser();

        when(authUserRepository.findByUserEmail("user@mail.com")).thenReturn(Optional.of(authUser));
        when(otpUtil.generateOtp()).thenReturn("123456");
        when(passwordEncoder.encode("123456")).thenReturn("encoded-otp");

        GetOtpResponse response = authUserService.getOtp(new GetOtpRequest("user@mail.com"));

        assertEquals("user@mail.com", response.email());
        assertEquals("123456", response.otp());
        assertEquals("encoded-otp", authUser.getOtpHash());
        assertEquals(0, authUser.getOtpAttempts());
        assertNull(authUser.getOtpVerifiedAt());
        assertNotNull(authUser.getOtpExpiresAt());
        assertNotNull(authUser.getOtpLastSentAt());

        verify(authUserRepository).save(authUser);
        verify(auditLogService).log(eq(201L), eq("AUTH_USER"), eq("GET-OTP"), isNull(), contains("OTP_TTL_SECONDS"));
    }

    @Test
    void verifyOtp_shouldIncrementAttemptsAndThrowWhenOtpDoesNotMatch() {
        AuthUser authUser = buildAuthUser();
        authUser.setOtpHash("encoded-otp");
        authUser.setOtpExpiresAt(Instant.now().plusSeconds(60));
        authUser.setOtpAttempts(0);

        when(authUserRepository.findByUserEmail("user@mail.com")).thenReturn(Optional.of(authUser));
        when(passwordEncoder.matches("123456", "encoded-otp")).thenReturn(false);

        assertThrows(
                InvalidOtpException.class,
                () -> authUserService.verifyOtp(new VerifyOtpRequest("user@mail.com", "123456"))
        );

        assertEquals(1, authUser.getOtpAttempts());
        verify(authUserRepository).save(authUser);
        verify(auditLogService).log(eq(201L), eq("AUTH_USER"), eq("VERIFY-OTP"), isNull(), contains("\"FAILED\""));
    }

    @Test
    void verifyOtp_shouldMarkOtpAsVerifiedWhenOtpMatches() {
        AuthUser authUser = buildAuthUser();
        authUser.setOtpHash("encoded-otp");
        authUser.setOtpExpiresAt(Instant.now().plusSeconds(60));
        authUser.setOtpAttempts(1);

        when(authUserRepository.findByUserEmail("user@mail.com")).thenReturn(Optional.of(authUser));
        when(passwordEncoder.matches("123456", "encoded-otp")).thenReturn(true);

        VerifyOtpResponse response = authUserService.verifyOtp(new VerifyOtpRequest("user@mail.com", "123456"));

        assertEquals("user@mail.com", response.email());
        assertEquals("OTP_VERIFIED", response.status());
        assertNotNull(authUser.getOtpVerifiedAt());

        verify(authUserRepository).save(authUser);
        verify(auditLogService).log(eq(201L), eq("AUTH_USER"), eq("VERIFY-OTP"), isNull(), contains("\"SUCCESSFUL\""));
    }

    @Test
    void resetPassword_shouldUpdatePasswordClearOtpStateAndNotify() {
        AuthUser authUser = buildAuthUser();
        authUser.setOtpVerifiedAt(Instant.now());
        authUser.setOtpHash("encoded-otp");
        authUser.setOtpExpiresAt(Instant.now().plusSeconds(60));
        authUser.setOtpAttempts(2);
        authUser.setOtpLastSentAt(Instant.now());

        when(authUserRepository.findByUserEmail("user@mail.com")).thenReturn(Optional.of(authUser));
        when(passwordEncoder.encode("Password@123")).thenReturn("new-encoded-password");

        ResetPasswordResponse response = authUserService.resetPassword(
                new ResetPasswordRequest("user@mail.com", "Password@123")
        );

        assertEquals("user@mail.com", response.email());
        assertEquals("RESET-SUCCESSFUL", response.status());
        assertEquals("new-encoded-password", authUser.getPasswordHash());
        assertNull(authUser.getOtpHash());
        assertNull(authUser.getOtpExpiresAt());
        assertNull(authUser.getOtpLastSentAt());
        assertNull(authUser.getOtpVerifiedAt());
        assertEquals(0, authUser.getOtpAttempts());
        assertNotNull(authUser.getPasswordChangedAt());

        verify(authUserRepository).save(authUser);
        verify(notificationService).notification(
                eq(authUser.getUser()),
                eq("Your password was reset successfully."),
                eq(NotificationStatus.UNREAD)
        );
    }

    @Test
    void resetPassword_shouldThrowWhenOtpWasNotVerified() {
        AuthUser authUser = buildAuthUser();
        authUser.setOtpVerifiedAt(null);

        when(authUserRepository.findByUserEmail("user@mail.com")).thenReturn(Optional.of(authUser));

        assertThrows(
                OtpNotVerifiedException.class,
                () -> authUserService.resetPassword(new ResetPasswordRequest("user@mail.com", "Password@123"))
        );

        verify(authUserRepository, never()).save(any());
        verifyNoInteractions(notificationService);
    }

    @Test
    void setPin_shouldStoreEncodedPinAndNotify() {
        AuthUser authUser = buildAuthUser();
        authUser.setPinHash(null);

        when(authUserRepository.findByUser_UserId(101L)).thenReturn(Optional.of(authUser));
        when(passwordEncoder.encode("123456")).thenReturn("encoded-pin");

        SetPinResponse response = authUserService.setPin(101L, new SetPinRequest("123456"));

        assertEquals("PIN SET SUCCESSFUL", response.status());
        assertEquals("encoded-pin", authUser.getPinHash());
        assertEquals(0, authUser.getPinAttempts());
        assertFalse(authUser.getIsLocked());

        verify(authUserRepository).save(authUser);
        verify(notificationService).notification(
                eq(authUser.getUser()),
                eq("Your CashFlash PIN was set successfully."),
                eq(NotificationStatus.UNREAD)
        );
    }

    @Test
    void setPin_shouldThrowWhenPinAlreadyExists() {
        AuthUser authUser = buildAuthUser();
        authUser.setPinHash("existing-pin");

        when(authUserRepository.findByUser_UserId(101L)).thenReturn(Optional.of(authUser));

        assertThrows(ResourceAlreadyExistsException.class, () -> authUserService.setPin(101L, new SetPinRequest("123456")));

        verify(authUserRepository, never()).save(any());
        verifyNoInteractions(notificationService);
    }

    @Test
    void verifyPin_shouldReturnFailureAndIncrementAttemptsWhenPinIsIncorrect() {
        AuthUser authUser = buildAuthUser();
        authUser.setPinHash("encoded-pin");
        authUser.setPinAttempts(1);
        authUser.setIsLocked(false);

        when(authUserRepository.findByUser_UserId(101L)).thenReturn(Optional.of(authUser));
        when(passwordEncoder.matches("123456", "encoded-pin")).thenReturn(false);

        VerifyPinResponse response = authUserService.verifyPin(101L, new VerifyPinRequest("123456"));

        assertFalse(response.success());
        assertEquals("Incorrect PIN. Attempts left: 1", response.message());
        assertEquals(2, authUser.getPinAttempts());
        assertNotNull(authUser.getLastFailedPinAttempt());

        verify(authUserRepository).save(authUser);
        verify(auditLogService).log(eq(201L), eq("AUTH_USER"), eq("VERIFY-PIN"), isNull(), contains("\"FAILED\""));
    }

    @Test
    void verifyPin_shouldLockAccountAfterMaxAttempts() {
        AuthUser authUser = buildAuthUser();
        authUser.setPinHash("encoded-pin");
        authUser.setPinAttempts(NumericalConstants.MAX_ATTEMPTS - 1);
        authUser.setIsLocked(false);

        when(authUserRepository.findByUser_UserId(101L)).thenReturn(Optional.of(authUser));
        when(passwordEncoder.matches("123456", "encoded-pin")).thenReturn(false);

        VerifyPinResponse response = authUserService.verifyPin(101L, new VerifyPinRequest("123456"));

        assertFalse(response.success());
        assertEquals("Too many incorrect attempts.", response.message());
        assertTrue(authUser.getIsLocked());
        assertEquals(NumericalConstants.MAX_ATTEMPTS, authUser.getPinAttempts());

        verify(authUserRepository).save(authUser);
        verify(auditLogService).log(eq(201L), eq("AUTH_USER"), eq("VERIFY-PIN"), isNull(), contains("\"LOCKED\""));
    }

    @Test
    void verifyPin_shouldResetCooldownAndReturnSuccessWhenPinMatches() {
        AuthUser authUser = buildAuthUser();
        authUser.setPinHash("encoded-pin");
        authUser.setPinAttempts(2);
        authUser.setIsLocked(true);
        authUser.setLastFailedPinAttempt(Instant.now().minusSeconds(31));

        when(authUserRepository.findByUser_UserId(101L)).thenReturn(Optional.of(authUser));
        when(passwordEncoder.matches("123456", "encoded-pin")).thenReturn(true);

        VerifyPinResponse response = authUserService.verifyPin(101L, new VerifyPinRequest("123456"));

        assertTrue(response.success());
        assertEquals("PIN verified", response.message());
        assertEquals(0, authUser.getPinAttempts());
        assertFalse(authUser.getIsLocked());
        assertNull(authUser.getLastFailedPinAttempt());

        verify(authUserRepository, times(2)).save(authUser);
        verify(auditLogService).log(eq(201L), eq("AUTH_USER"), eq("VERIFY-PIN"), isNull(), contains("SUCCESSFUL"));
    }

    private AuthUser buildAuthUser() {
        User user = new User();
        user.setUserId(101L);
        user.setFullName("Akshay Maruti Shet");
        user.setEmail("user@mail.com");
        user.setPhoneNumber("9876543210");
        user.setRole(UserRole.USER);

        AuthUser authUser = new AuthUser();
        authUser.setAuthUserId(201L);
        authUser.setUser(user);
        authUser.setPinAttempts(0);
        authUser.setOtpAttempts(0);
        authUser.setIsLocked(false);
        return authUser;
    }
}
