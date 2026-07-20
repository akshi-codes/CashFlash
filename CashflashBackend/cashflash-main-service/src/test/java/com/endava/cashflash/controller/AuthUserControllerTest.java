package com.endava.cashflash.controller;

import com.endava.cashflash.constants.ApiPaths;
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
import com.endava.cashflash.enums.UserRole;
import com.endava.cashflash.exception.GlobalExceptionHandler;
import com.endava.cashflash.security.AuthPrincipal;
import com.endava.cashflash.service.AuthUserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthUserControllerTest {

    @Mock
    private AuthUserService authUserService;

    @Mock
    private AuthPrincipal authPrincipal;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        AuthUserController controller = new AuthUserController(authUserService);

        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .setValidator(validator)
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void setAuthenticatedPrincipal(AuthPrincipal principal) {
        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken(principal, null));
    }

    @Test
    void logIn_shouldReturn200AndPassNormalizedRequestToService() throws Exception {
        String requestJson = """
                {
                  "email": "  USER@MAIL.COM  ",
                  "password": "Password@123"
                }
                """;

        when(authUserService.logIn(any(LogInRequest.class))).thenReturn(new LogInResponse(
                "jwt-token",
                "Akshay Maruti Shet",
                "user@mail.com",
                "9876543210",
                UserRole.USER,
                "https://cdn.test/profile.png",
                true,
                true
        ));

        mockMvc.perform(post(ApiPaths.AUTH_USER_BASE + ApiPaths.LOG_IN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token"))
                .andExpect(jsonPath("$.email").value("user@mail.com"))
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.isKycCompleted").value(true))
                .andExpect(jsonPath("$.isPinSet").value(true));

        ArgumentCaptor<LogInRequest> captor = ArgumentCaptor.forClass(LogInRequest.class);
        verify(authUserService).logIn(captor.capture());
        assertEquals("user@mail.com", captor.getValue().email());
    }

    @Test
    void logIn_shouldReturn400ForMalformedJson() throws Exception {
        mockMvc.perform(post(ApiPaths.AUTH_USER_BASE + ApiPaths.LOG_IN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.message").value("Invalid request body"));

        verifyNoInteractions(authUserService);
    }

    @Test
    void getOtp_shouldReturn200AndPassNormalizedRequestToService() throws Exception {
        String requestJson = """
                {
                  "email": "  USER@MAIL.COM  "
                }
                """;

        when(authUserService.getOtp(any(GetOtpRequest.class)))
                .thenReturn(new GetOtpResponse("user@mail.com", "123456"));

        mockMvc.perform(post(ApiPaths.AUTH_USER_BASE + ApiPaths.GET_OTP)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("user@mail.com"))
                .andExpect(jsonPath("$.otp").value("123456"));

        ArgumentCaptor<GetOtpRequest> captor = ArgumentCaptor.forClass(GetOtpRequest.class);
        verify(authUserService).getOtp(captor.capture());
        assertEquals("user@mail.com", captor.getValue().email());
    }

    @Test
    void verifyOtp_shouldReturn200AndPassNormalizedRequestToService() throws Exception {
        String requestJson = """
                {
                  "email": "  USER@MAIL.COM  ",
                  "otp": " 123456 "
                }
                """;

        when(authUserService.verifyOtp(any(VerifyOtpRequest.class)))
                .thenReturn(new VerifyOtpResponse("user@mail.com", "OTP_VERIFIED"));

        mockMvc.perform(post(ApiPaths.AUTH_USER_BASE + ApiPaths.VERIFY_OTP)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("user@mail.com"))
                .andExpect(jsonPath("$.status").value("OTP_VERIFIED"));

        ArgumentCaptor<VerifyOtpRequest> captor = ArgumentCaptor.forClass(VerifyOtpRequest.class);
        verify(authUserService).verifyOtp(captor.capture());
        assertEquals("user@mail.com", captor.getValue().email());
        assertEquals("123456", captor.getValue().otp());
    }

    @Test
    void resetPassword_shouldReturn200AndPassNormalizedRequestToService() throws Exception {
        String requestJson = """
                {
                  "email": "  USER@MAIL.COM  ",
                  "newPassword": "  Password@123  "
                }
                """;

        when(authUserService.resetPassword(any(ResetPasswordRequest.class)))
                .thenReturn(new ResetPasswordResponse("user@mail.com", "RESET-SUCCESSFUL"));

        mockMvc.perform(post(ApiPaths.AUTH_USER_BASE + ApiPaths.RESET_PASSWORD)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("user@mail.com"))
                .andExpect(jsonPath("$.status").value("RESET-SUCCESSFUL"));

        ArgumentCaptor<ResetPasswordRequest> captor = ArgumentCaptor.forClass(ResetPasswordRequest.class);
        verify(authUserService).resetPassword(captor.capture());
        assertEquals("user@mail.com", captor.getValue().email());
        assertEquals("Password@123", captor.getValue().newPassword());
    }

    @Test
    void setPin_shouldReturn200AndPassPrincipalAndRequestToService() throws Exception {
        setAuthenticatedPrincipal(authPrincipal);
        when(authPrincipal.getUserId()).thenReturn(101L);

        String requestJson = """
                {
                  "pin": "123456"
                }
                """;

        when(authUserService.setPin(eq(101L), any(SetPinRequest.class)))
                .thenReturn(new SetPinResponse("PIN SET SUCCESSFUL"));

        mockMvc.perform(post(ApiPaths.AUTH_USER_BASE + ApiPaths.SET_PIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PIN SET SUCCESSFUL"));

        ArgumentCaptor<SetPinRequest> captor = ArgumentCaptor.forClass(SetPinRequest.class);
        verify(authUserService).setPin(eq(101L), captor.capture());
        assertEquals("123456", captor.getValue().pin());
    }

    @Test
    void verifyPin_shouldReturn200AndPassPrincipalAndRequestToService() throws Exception {
        setAuthenticatedPrincipal(authPrincipal);
        when(authPrincipal.getUserId()).thenReturn(101L);

        String requestJson = """
                {
                  "pin": "123456"
                }
                """;

        when(authUserService.verifyPin(eq(101L), any(VerifyPinRequest.class)))
                .thenReturn(new VerifyPinResponse(true, "PIN verified"));

        mockMvc.perform(post(ApiPaths.AUTH_USER_BASE + ApiPaths.VERIFY_PIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("PIN verified"));

        ArgumentCaptor<VerifyPinRequest> captor = ArgumentCaptor.forClass(VerifyPinRequest.class);
        verify(authUserService).verifyPin(eq(101L), captor.capture());
        assertEquals("123456", captor.getValue().pin());
    }

    @Test
    void setPin_shouldReturn400WhenPinIsInvalid() throws Exception {
        setAuthenticatedPrincipal(authPrincipal);

        String requestJson = """
                {
                  "pin": "123"
                }
                """;

        mockMvc.perform(post(ApiPaths.AUTH_USER_BASE + ApiPaths.SET_PIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.message").value("PIN must be exactly 6 digits"));

        verifyNoInteractions(authUserService);
    }
}
