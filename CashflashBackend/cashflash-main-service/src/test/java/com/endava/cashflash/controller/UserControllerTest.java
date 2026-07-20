package com.endava.cashflash.controller;

import com.endava.cashflash.constants.ApiPaths;
import com.endava.cashflash.dto.internal.BankAccountResponse;
import com.endava.cashflash.dto.internal.CardResponse;
import com.endava.cashflash.dto.internal.WalletResponse;
import com.endava.cashflash.dto.response.GetKycUpgradeStatusResponse;
import com.endava.cashflash.dto.request.SignUpRequest;
import com.endava.cashflash.dto.response.SignUpResponse;
import com.endava.cashflash.dto.response.UploadKycUpgradeResponse;
import com.endava.cashflash.dto.response.UserPaymentMethodsResponse;
import com.endava.cashflash.enums.CardType;
import com.endava.cashflash.enums.KycStatus;
import com.endava.cashflash.enums.Provider;
import com.endava.cashflash.exception.GlobalExceptionHandler;
import com.endava.cashflash.security.AuthPrincipal;
import com.endava.cashflash.service.KycUpgradeService;
import com.endava.cashflash.service.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserService userService;

    @Mock
    private KycUpgradeService kycUpgradeService;

    @Mock
    private AuthPrincipal authPrincipal;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        UserController userController = new UserController(userService, kycUpgradeService);

        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        mockMvc = MockMvcBuilders.standaloneSetup(userController)
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
    void signUp_shouldReturn200AndResponseBody() throws Exception {
        String requestJson = """
                {
                  "fullName": "Akshay Maruti Shet",
                  "email": "akshay@mail.com",
                  "phoneNumber": "9876543210",
                  "password": "Password@123"
                }
                """;

        SignUpResponse response = new SignUpResponse(
                101L,
                "Akshay Maruti Shet",
                "akshay@mail.com",
                "9876543210"
        );

        when(userService.signUp(any(SignUpRequest.class))).thenReturn(response);

        mockMvc.perform(post(ApiPaths.USER_BASE + "/sign-up")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(101))
                .andExpect(jsonPath("$.fullName").value("Akshay Maruti Shet"))
                .andExpect(jsonPath("$.email").value("akshay@mail.com"))
                .andExpect(jsonPath("$.phoneNumber").value("9876543210"));

        verify(userService).signUp(any(SignUpRequest.class));
    }

    @Test
    void signUp_shouldPassNormalizedRequestToService() throws Exception {
        String requestJson = """
                {
                  "fullName": "Akshay Maruti Shet",
                  "email": "  AKSHAY@MAIL.COM  ",
                  "phoneNumber": "  9876543210  ",
                  "password": "Password@123"
                }
                """;

        SignUpResponse response = new SignUpResponse(
                101L,
                "Akshay Maruti Shet",
                "akshay@mail.com",
                "9876543210"
        );

        when(userService.signUp(any(SignUpRequest.class))).thenReturn(response);

        mockMvc.perform(post(ApiPaths.USER_BASE + "/sign-up")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk());

        ArgumentCaptor<SignUpRequest> captor = ArgumentCaptor.forClass(SignUpRequest.class);
        verify(userService).signUp(captor.capture());

        assertEquals("akshay@mail.com", captor.getValue().email());
        assertEquals("9876543210", captor.getValue().phoneNumber());
    }

    @Test
    void signUp_shouldReturn400ForMalformedJson() throws Exception {
        mockMvc.perform(post(ApiPaths.USER_BASE + "/sign-up")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(userService);
    }

    @Test
    void getUserPaymentMethods_shouldReturn200AndResponseBody() throws Exception {
        setAuthenticatedPrincipal(authPrincipal);
        when(authPrincipal.getUserId()).thenReturn(101L);

        UserPaymentMethodsResponse response = new UserPaymentMethodsResponse(
                new WalletResponse(
                        11L,
                        new BigDecimal("2500.00"),
                        new BigDecimal("300.00"),
                        Instant.parse("2026-04-20T10:15:30Z"),
                        true,
                        false
                ),
                List.of(new BankAccountResponse(21L, "6789", "HDFC", "HDFC0001234", true, true)),
                List.of(new CardResponse(31L, "1234", Provider.VISA, CardType.CREDIT, "08", "2030", false, true))
        );

        when(userService.getUserPaymentMethods(101L)).thenReturn(response);

        mockMvc.perform(get(ApiPaths.USER_BASE + ApiPaths.USER_PAYMENT_METHODS))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.wallet.walletId").value(11))
                .andExpect(jsonPath("$.wallet.balance").value(2500.00))
                .andExpect(jsonPath("$.bankAccounts[0].bankName").value("HDFC"))
                .andExpect(jsonPath("$.cards[0].provider").value("VISA"));

        verify(userService).getUserPaymentMethods(101L);
    }

    @Test
    void updateProfilePicture_shouldReturn200AndPassFileToService() throws Exception {
        setAuthenticatedPrincipal(authPrincipal);
        when(authPrincipal.getUserId()).thenReturn(101L);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "avatar.png",
                MediaType.IMAGE_PNG_VALUE,
                "image-content".getBytes(StandardCharsets.UTF_8)
        );

        when(userService.setProfilePicture(eq(101L), any())).thenReturn("https://cdn.test/101/avatar.png");

        MockMultipartHttpServletRequestBuilder request = multipart(
                ApiPaths.USER_BASE + ApiPaths.USER_PROFILE_PICTURE
        );
        request.with(httpRequest -> {
            httpRequest.setMethod("POST");
            return httpRequest;
        });

        mockMvc.perform(request.file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profileImageUrl").value("https://cdn.test/101/avatar.png"));

        verify(userService).setProfilePicture(eq(101L), any());
    }

    @Test
    void updateProfilePicture_shouldReturn400WhenFilePartIsMissing() throws Exception {
        setAuthenticatedPrincipal(authPrincipal);

        MockMultipartHttpServletRequestBuilder request = multipart(
                ApiPaths.USER_BASE + ApiPaths.USER_PROFILE_PICTURE
        );
        request.with(httpRequest -> {
            httpRequest.setMethod("POST");
            return httpRequest;
        });

        mockMvc.perform(request)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("MISSING_FILE_PART"))
                .andExpect(jsonPath("$.message").value("Required file part is missing: file"));

        verifyNoInteractions(userService);
    }

    @Test
    void uploadKycUpgrade_shouldReturn200AndPassFileToService() throws Exception {
        setAuthenticatedPrincipal(authPrincipal);
        when(authPrincipal.getUserId()).thenReturn(101L);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "kyc.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                "pdf-content".getBytes(StandardCharsets.UTF_8)
        );

        when(kycUpgradeService.uploadKycUpgrade(eq(101L), any()))
                .thenReturn(new UploadKycUpgradeResponse(KycStatus.PENDING));

        MockMultipartHttpServletRequestBuilder request = multipart(
                ApiPaths.USER_BASE + ApiPaths.USER_KYC_UPGRADE
        );
        request.with(httpRequest -> {
            httpRequest.setMethod("POST");
            return httpRequest;
        });

        mockMvc.perform(request.file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.kycStatus").value("PENDING"));

        verify(kycUpgradeService).uploadKycUpgrade(eq(101L), any());
    }

    @Test
    void getKycUpgradeStatus_shouldReturn200AndResponseBody() throws Exception {
        setAuthenticatedPrincipal(authPrincipal);
        when(authPrincipal.getUserId()).thenReturn(101L);

        when(kycUpgradeService.getKycUpgradeStatus(101L))
                .thenReturn(new GetKycUpgradeStatusResponse(KycStatus.APPROVED));

        mockMvc.perform(get(ApiPaths.USER_BASE + ApiPaths.USER_KYC_UPGRADE_STATUS))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.kycStatus").value("APPROVED"));

        verify(kycUpgradeService).getKycUpgradeStatus(101L);
    }

    @Test
    void getKycUpgradeDocument_shouldReturn200AndPdfResource() throws Exception {
        setAuthenticatedPrincipal(authPrincipal);
        when(authPrincipal.getUserId()).thenReturn(101L);

        byte[] pdfBytes = "dummy pdf".getBytes(StandardCharsets.UTF_8);
        ByteArrayResource resource = new ByteArrayResource(pdfBytes);

        when(kycUpgradeService.getKycDocument(101L)).thenReturn(resource);

        mockMvc.perform(get(ApiPaths.USER_BASE + ApiPaths.USER_KYC_UPGRADE_DOCUMENT))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(content().bytes(pdfBytes));

        verify(kycUpgradeService).getKycDocument(101L);
    }
}
