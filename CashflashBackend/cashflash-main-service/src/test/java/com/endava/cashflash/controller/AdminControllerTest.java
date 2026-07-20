package com.endava.cashflash.controller;

import com.endava.cashflash.constants.ApiPaths;
import com.endava.cashflash.dto.request.AdminReviewKycUpgradeRequest;
import com.endava.cashflash.dto.request.DeactivateUserRequest;
import com.endava.cashflash.dto.response.AdminOverviewResponse;
import com.endava.cashflash.dto.response.AdminReviewKycUpgradeResponse;
import com.endava.cashflash.dto.response.DeactivateUserResponse;
import com.endava.cashflash.dto.response.PendingKycUpgradeResponse;
import com.endava.cashflash.enums.KycStatus;
import com.endava.cashflash.exception.GlobalExceptionHandler;
import com.endava.cashflash.security.AuthPrincipal;
import com.endava.cashflash.service.AdminService;
import com.endava.cashflash.service.KycUpgradeService;
import com.endava.cashflash.service.TransactionService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AdminControllerTest {

    @Mock
    private AdminService adminService;

    @Mock
    private KycUpgradeService kycUpgradeService;

    @Mock
    private TransactionService transactionService;

    @Mock
    private AuthPrincipal authPrincipal;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        AdminController adminController = new AdminController(
                adminService,
                transactionService,
                kycUpgradeService
        );

        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        // Builds standalone MockMvc with validation and global exception handling
        mockMvc = MockMvcBuilders.standaloneSetup(adminController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .setValidator(validator)
                .build();
    }

    @AfterEach
    void tearDown() {
        // Clears the security context after each test
        SecurityContextHolder.clearContext();
    }

    // Sets the authenticated admin for @AuthenticationPrincipal resolution
    private void setAuthenticatedPrincipal(AuthPrincipal principal) {
        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken(principal, null));
    }

    @Test
    void overview_shouldReturn200AndResponseBody() throws Exception {
        AdminOverviewResponse response = new AdminOverviewResponse(
                10L,
                2L,
                25L,
                20L,
                0L,
                5L,
                new BigDecimal("12500.50"),
                3600L,
                12L,
                null
        );

        when(adminService.getOverview()).thenReturn(response);

        mockMvc.perform(get(ApiPaths.ADMIN_BASE + ApiPaths.ADMIN_STATS))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers").value(10))
                .andExpect(jsonPath("$.totalMerchants").value(2))
                .andExpect(jsonPath("$.totalTransactions").value(25))
                .andExpect(jsonPath("$.successfulTransactions").value(20))
                .andExpect(jsonPath("$.failedTransactions").value(5))
                .andExpect(jsonPath("$.totalAmount").value(12500.50))
                .andExpect(jsonPath("$.uptimeSeconds").value(3600))
                .andExpect(jsonPath("$.loginCount").value(12));

        verify(adminService).getOverview();
    }

    @Test
    void deactivateUser_shouldReturn200AndPassRequestToService() throws Exception {
        setAuthenticatedPrincipal(authPrincipal);
        when(authPrincipal.getUserId()).thenReturn(101L);

        String requestJson = """
                {
                  "userId": 55
                }
                """;

        DeactivateUserResponse response = new DeactivateUserResponse(55L, true);

        when(adminService.deactivateUser(any(Long.class), any(DeactivateUserRequest.class))).thenReturn(response);

        mockMvc.perform(put(ApiPaths.ADMIN_BASE + ApiPaths.ADMIN_USER_DEACTIVATE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(55))
                .andExpect(jsonPath("$.isDeactivated").value(true));

        // Captures the request passed to the service for verification
        ArgumentCaptor<DeactivateUserRequest> captor = ArgumentCaptor.forClass(DeactivateUserRequest.class);
        verify(adminService).deactivateUser(eq(101L), captor.capture());

        assertEquals(55L, captor.getValue().userId());
    }

    @Test
    void deactivateUser_shouldReturn400WhenUserIdIsMissing() throws Exception {
        setAuthenticatedPrincipal(authPrincipal);

        String requestJson = """
                {
                }
                """;

        mockMvc.perform(put(ApiPaths.ADMIN_BASE + ApiPaths.ADMIN_USER_DEACTIVATE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.message").value("Invalid value for: userId"));

        verifyNoInteractions(adminService);
    }

    @Test
    void getPendingKycUpgrades_shouldReturn200AndResponseBody() throws Exception {
        List<PendingKycUpgradeResponse> response = List.of(
                new PendingKycUpgradeResponse(
                        21L,
                        "Akshay Maruti Shet",
                        "akshay@mail.com",
                        KycStatus.PENDING
                )
        );

        when(kycUpgradeService.getPendingKycUpgrades()).thenReturn(response);

        mockMvc.perform(get(ApiPaths.ADMIN_BASE + ApiPaths.ADMIN_KYC_UPGRADE_PENDING))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].userId").value(21))
                .andExpect(jsonPath("$[0].fullName").value("Akshay Maruti Shet"))
                .andExpect(jsonPath("$[0].email").value("akshay@mail.com"))
                .andExpect(jsonPath("$[0].kycStatus").value("PENDING"));

        verify(kycUpgradeService).getPendingKycUpgrades();
    }

    @Test
    void reviewKycUpgrade_shouldReturn200AndPassRequestToService() throws Exception {
        String requestJson = """
                {
                  "userId": 77,
                  "kycStatus": "APPROVED"
                }
                """;

        AdminReviewKycUpgradeResponse response = new AdminReviewKycUpgradeResponse(77L, KycStatus.APPROVED);

        when(kycUpgradeService.reviewKycUpgrade(any(AdminReviewKycUpgradeRequest.class))).thenReturn(response);

        mockMvc.perform(post(ApiPaths.ADMIN_BASE + ApiPaths.ADMIN_KYC_UPGRADE_REVIEW)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(77))
                .andExpect(jsonPath("$.kycStatus").value("APPROVED"));

        // Captures the review request passed to the service
        ArgumentCaptor<AdminReviewKycUpgradeRequest> captor =
                ArgumentCaptor.forClass(AdminReviewKycUpgradeRequest.class);
        verify(kycUpgradeService).reviewKycUpgrade(captor.capture());

        assertEquals(77L, captor.getValue().userId());
        assertEquals(KycStatus.APPROVED, captor.getValue().kycStatus());
    }

    @Test
    void reviewKycUpgrade_shouldReturn400WhenUserIdIsMissing() throws Exception {
        String requestJson = """
                {
                  "kycStatus": "APPROVED"
                }
                """;

        mockMvc.perform(post(ApiPaths.ADMIN_BASE + ApiPaths.ADMIN_KYC_UPGRADE_REVIEW)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.message").value("Invalid value for: userId"));

        verifyNoInteractions(kycUpgradeService);
    }

    @Test
    void getKycUpgradeDocument_shouldReturn200AndPdfResource() throws Exception {
        byte[] pdfBytes = "dummy pdf".getBytes(StandardCharsets.UTF_8);
        ByteArrayResource resource = new ByteArrayResource(pdfBytes);

        when(kycUpgradeService.getKycDocument(44L)).thenReturn(resource);

        mockMvc.perform(get(ApiPaths.ADMIN_BASE + ApiPaths.ADMIN_KYC_UPGRADE_DOCUMENT)
                        .param("userId", "44"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(content().bytes(pdfBytes));

        verify(kycUpgradeService).getKycDocument(44L);
    }
}
