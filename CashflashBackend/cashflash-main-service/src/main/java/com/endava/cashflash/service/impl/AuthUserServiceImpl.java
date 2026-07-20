package com.endava.cashflash.service.impl;

import com.endava.cashflash.constants.Literals;
import com.endava.cashflash.constants.NumericalConstants;
import com.endava.cashflash.dto.request.*;
import com.endava.cashflash.dto.response.*;
import com.endava.cashflash.exception.*;
import com.endava.cashflash.model.AuthUser;
import com.endava.cashflash.model.User;
import com.endava.cashflash.repository.AuthUserRepository;
import com.endava.cashflash.enums.NotificationStatus;
import com.endava.cashflash.service.NotificationService;
import com.endava.cashflash.service.AuditLogService;
import com.endava.cashflash.service.AuthUserService;
import com.endava.cashflash.util.JwtUtil;
import com.endava.cashflash.util.OtpUtil;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

@Service
@Transactional
@RequiredArgsConstructor
public class AuthUserServiceImpl implements AuthUserService {

    private final AuthUserRepository authUserRepository; // Repository to fetch auth user details
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final OtpUtil otpUtil;

    /**
     * Logs in a user by validating the provided email and password.
     * @param request login request containing email and password
     * @return login response containing basic user details
     * @throws InvalidCredentialsException when email is not found or password does not match
     */
    @Override
    public LogInResponse logIn(
            LogInRequest request
    ) {

        AuthUser authUser = authUserRepository.findByUserEmail(request.email())
                .orElseThrow(InvalidEmailException::new); // Fetches auth user by email

        User user = authUser.getUser(); // Gets user linked to auth record

        if (!passwordEncoder.matches(request.password(), authUser.getPasswordHash())) {
            throw new InvalidCredentialsException(); // Throws when password is incorrect
        }

        String token = jwtUtil.generateToken(user.getUserId(), user.getEmail(), user.getRole()); // Generates JWT token

        boolean isPinSet = authUser.getPinHash() != null; // Checks if PIN is set
        boolean isKycCompleted = user.getKycDocumentPath() != null;

        auditLogService.log(
                authUser.getAuthUserId(),
                Literals.AUTH_USER,
                Literals.LOG_IN,
                null,
                Literals.STATUS.formatted(Literals.SUCCESSFUL)
        ); // Audit log for successful login

        return new LogInResponse(
                token,
                user.getFullName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getRole(),
                user.getProfileImageUrl(),
                isKycCompleted,
                isPinSet
        );
    }

    /**
     * Verifies the user by validating the provided email.
     * @param request containing email
     * @return OTP after email verification
     * @throws InvalidEmailException when email is not found
     */
    @Override
    public GetOtpResponse getOtp(
            GetOtpRequest request
    ) {

        AuthUser authUser = authUserRepository.findByUserEmail(request.email())
                .orElseThrow(InvalidEmailException::new); // Fetches auth user by email

        User user = authUser.getUser(); // Gets user linked to auth record

        String plainOtp = otpUtil.generateOtp(); // Generates plain OTP

        String hashedOtp = passwordEncoder.encode(plainOtp); // Hashes OTP before storing

        authUser.setOtpHash(hashedOtp);
        authUser.setOtpExpiresAt(Instant.now().plusSeconds(NumericalConstants.OTP_EXPIRY));
        authUser.setOtpAttempts(0);
        authUser.setOtpLastSentAt(Instant.now());
        authUser.setOtpVerifiedAt(null);
        authUserRepository.save(authUser); // Stores OTP state for verification

        auditLogService.log(
                authUser.getAuthUserId(),
                Literals.AUTH_USER,
                Literals.GET_OTP,
                null,
                otpIssuedAuditPayload(user.getEmail())

        ); // Audit log for OTP generation

        return new GetOtpResponse(
                user.getEmail(),
                plainOtp
        );
    }

    /**
     * Verifies the OTP for the provided email within expiry and attempt limits.
     * @param request request containing email and OTP
     * @return OTP verification result
     * @throws InvalidEmailException when email is not found
     * @throws NoOtpRequestedException when OTP is not generated
     * @throws OtpExpiredException when OTP is expired
     * @throws OtpAttemptsExceededException when max attempts exceeded
     * @throws InvalidOtpException when OTP does not match
     */
    @Override
    public VerifyOtpResponse verifyOtp(
            VerifyOtpRequest request
    ) {

        AuthUser authUser = authUserRepository.findByUserEmail(request.email())
                .orElseThrow(InvalidEmailException::new); // Fetches auth user by email

        User user = authUser.getUser(); // Gets user linked to auth record

        if(authUser.getOtpHash() == null || authUser.getOtpExpiresAt() == null) {
            throw new NoOtpRequestedException(); // Throws when OTP was not requested
        }

        if(Instant.now().isAfter(authUser.getOtpExpiresAt())) {
            throw new OtpExpiredException(); // Throws when OTP is expired
        }

        if(authUser.getOtpAttempts() >= NumericalConstants.OTP_ATTEMPTS) {
            throw new OtpAttemptsExceededException(); // Throws when max attempts are exceeded
        }

        if(!passwordEncoder.matches(request.otp(), authUser.getOtpHash())) {
            authUser.setOtpAttempts(authUser.getOtpAttempts() + 1);
            authUserRepository.save(authUser); // Updates OTP attempt count on failure

            auditLogService.log(
                    authUser.getAuthUserId(),
                    Literals.AUTH_USER,
                    Literals.VERIFY_OTP,
                    null,
                    otpVerificationAuditPayload(user.getEmail(), Literals.FAILED, authUser.getOtpAttempts())
            ); // Audit log for failed OTP verification

            throw new InvalidOtpException(); // Throws when OTP does not match
        }

        authUser.setOtpVerifiedAt(Instant.now());
        authUserRepository.save(authUser); // Marks OTP as verified

        auditLogService.log(
                authUser.getAuthUserId(),
                Literals.AUTH_USER,
                Literals.VERIFY_OTP,
                null,
                otpVerificationAuditPayload(authUser.getUser().getEmail(), Literals.SUCCESSFUL, authUser.getOtpAttempts())
        ); // Audit log for successful OTP verification

        return new VerifyOtpResponse(
                user.getEmail(),
                "OTP_VERIFIED"
        );
    }

    /**
     * Resets password only if OTP was verified within the allowed time window.
     * @param request request containing email and new password
     * @return reset password response
     * @throws InvalidEmailException when email is not found
     * @throws OtpNotVerifiedException when OTP is not verified
     * @throws OtpExpiredException when OTP verification window is expired
     */
    @Override
    public ResetPasswordResponse resetPassword(
            ResetPasswordRequest request
    ) {

        AuthUser authUser = authUserRepository.findByUserEmail(request.email())
                .orElseThrow(InvalidEmailException::new); // Fetches auth user by email

        User user = authUser.getUser(); // Gets user linked to auth record

        if (authUser.getOtpVerifiedAt() == null) {
            throw new OtpNotVerifiedException(); // Throws when OTP is not verified
        }

        if (Instant.now().isAfter(authUser.getOtpVerifiedAt().plusSeconds(NumericalConstants.OTP_EXPIRY))) {
            throw new OtpExpiredException(); // Throws when OTP verified window is expired
        }

        authUser.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        authUser.setPasswordChangedAt(Instant.now()); // Updates password hash and change time

        authUser.setOtpHash(null);
        authUser.setOtpExpiresAt(null);
        authUser.setOtpAttempts(0);
        authUser.setOtpLastSentAt(null);
        authUser.setOtpVerifiedAt(null);
        authUserRepository.save(authUser); // Clears OTP state after successful reset

        auditLogService.log(
                authUser.getAuthUserId(),
                Literals.AUTH_USER,
                Literals.RESET_PASSWORD,
                null,
                authStatusAuditPayload(authUser.getUser().getEmail(), Literals.SUCCESSFUL)
        ); // Audit log for password reset

        notificationService.notification(
                user,
                "Your password was reset successfully.",
                NotificationStatus.UNREAD
        );

        return new ResetPasswordResponse(
                user.getEmail(),
                "RESET-SUCCESSFUL"
        );
    }

    /**
     * Sets a PIN for the given userId if it is not already set.
     * @param userId user identifier
     * @param request request containing PIN
     * @return set PIN response
     * @throws ResourceNotFoundException when auth user is not found
     * @throws ResourceAlreadyExistsException when PIN is already set
     */
    @Override
    public SetPinResponse setPin(
            Long userId,
            SetPinRequest request
    ) {

        AuthUser authUser = authUserRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("AuthUser", userId)); // Fetches auth user by userId

        User user = authUser.getUser();

        if (authUser.getPinHash() != null) {
            throw new ResourceAlreadyExistsException("Pin"); // Throws when PIN is already set
        }

        String pinHash = passwordEncoder.encode(request.pin()); // Hashes PIN before storing

        authUser.setPinHash(pinHash);
        authUser.setPinAttempts(0);
        authUser.setIsLocked(false);

        authUserRepository.save(authUser); // Saves PIN state

        auditLogService.log(
                authUser.getAuthUserId(),
                Literals.AUTH_USER,
                Literals.SET_PIN,
                null,
                Literals.STATUS.formatted(Literals.SUCCESSFUL)
        ); // Audit log for PIN set

        notificationService.notification(
                user,
                "Your CashFlash PIN was set successfully.",
                NotificationStatus.UNREAD
        );

        return new SetPinResponse(
                "PIN SET SUCCESSFUL"
        );
    }

    /**
     * Verifies the PIN for the given userId and applies lockout after repeated failures.
     * @param userId user identifier
     * @param request request containing PIN
     * @return PIN verification result
     * @throws ResourceNotFoundException when auth user is not found
     */
    @Override
    public VerifyPinResponse verifyPin(Long userId, VerifyPinRequest request) {

        AuthUser authUser = authUserRepository
                .findByUser_UserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("AuthUser", userId)); // Fetches auth user by userId

        if (authUser.getLastFailedPinAttempt() != null) {
            long secondsPassed = Duration.between(
                    authUser.getLastFailedPinAttempt(),
                    Instant.now()
            ).getSeconds();

            if (secondsPassed >= 30) {
                authUser.setPinAttempts(0);
                authUser.setIsLocked(false);
                authUser.setLastFailedPinAttempt(null);
                authUserRepository.save(authUser); // Resets lock after cooldown
            }
        }

        if (Boolean.TRUE.equals(authUser.getIsLocked())) {

            auditLogService.log(
                    authUser.getAuthUserId(),
                    Literals.AUTH_USER,
                    Literals.VERIFY_PIN,
                    null,
                    Literals.STATUS.formatted(Literals.LOCKED)
            ); // Audit log for locked PIN verification attempt

            return new VerifyPinResponse(
                    false,
                    "Account locked. Please wait 30 seconds."
            );
        }

        boolean matches = passwordEncoder.matches(
                request.pin(),
                authUser.getPinHash()
        );

        if (!matches) {
            int attempts = (authUser.getPinAttempts() == null ? 0 : authUser.getPinAttempts()) + 1;
            authUser.setPinAttempts(attempts);
            authUser.setLastFailedPinAttempt(Instant.now());

            if (attempts >= NumericalConstants.MAX_ATTEMPTS) {
                authUser.setIsLocked(true);
                authUserRepository.save(authUser); // Locks account after max attempts

                auditLogService.log(
                        authUser.getAuthUserId(),
                        Literals.AUTH_USER,
                        Literals.VERIFY_PIN,
                        null,
                        """
                        {
                          "STATUS": "%s",
                          "PIN_ATTEMPTS": "%s"
                        }
                        """.formatted(Literals.LOCKED, attempts)
                ); // Audit log for PIN lock event

                return new VerifyPinResponse(
                        false,
                        "Too many incorrect attempts."
                );
            }

            authUserRepository.save(authUser); // Saves failed attempt count

            auditLogService.log(
                    authUser.getAuthUserId(),
                    Literals.AUTH_USER,
                    Literals.VERIFY_PIN,
                    null,
                    """
                    {
                      "STATUS": "%s",
                      "PIN_ATTEMPTS": "%s"
                    }
                    """.formatted( Literals.FAILED, attempts)
            ); // Audit log for failed PIN verification

            return new VerifyPinResponse(
                    false,
                    "Incorrect PIN. Attempts left: " +
                            (NumericalConstants.MAX_ATTEMPTS - attempts)
            );
        }

        authUser.setPinAttempts(0);
        authUser.setIsLocked(false);
        authUser.setLastFailedPinAttempt(null);
        authUserRepository.save(authUser); // Clears PIN failure state on success

        auditLogService.log(
                authUser.getAuthUserId(),
                Literals.AUTH_USER,
                Literals.VERIFY_PIN,
                null,
                Literals.STATUS.formatted(Literals.SUCCESSFUL)
        ); // Audit log for successful PIN verification

        return new VerifyPinResponse(true, "PIN verified");
    }

    private String otpIssuedAuditPayload(String email) {
        return """
                {
                  "EMAIL_MASKED": "%s",
                  "STATUS": "%s",
                  "OTP_TTL_SECONDS": "%s"
                }
                """.formatted(maskEmail(email), Literals.SUCCESSFUL, NumericalConstants.OTP_EXPIRY);
    }

    private String otpVerificationAuditPayload(String email, String status, Integer attempts) {
        return """
                {
                  "EMAIL_MASKED": "%s",
                  "STATUS": "%s",
                  "OTP_ATTEMPTS": "%s"
                }
                """.formatted(maskEmail(email), status, attempts == null ? 0 : attempts);
    }

    private String authStatusAuditPayload(String email, String status) {
        return """
                {
                  "EMAIL_MASKED": "%s",
                  "STATUS": "%s"
                }
                """.formatted(maskEmail(email), status);
    }

    private String maskEmail(String email) {
        if (email == null || email.isBlank()) {
            return "unknown";
        }

        int atIndex = email.indexOf('@');
        if (atIndex <= 1) {
            return "***" + email.substring(Math.max(atIndex, 0));
        }

        return email.substring(0, 2) + "***" + email.substring(atIndex);
    }
}
