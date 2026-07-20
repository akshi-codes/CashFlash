package com.endava.cashflash.controller;

import com.endava.cashflash.constants.ApiPaths;
import com.endava.cashflash.dto.request.ActivateUserRequest;
import com.endava.cashflash.dto.request.AdminReviewKycUpgradeRequest;
import com.endava.cashflash.dto.request.DeactivateUserRequest;
import com.endava.cashflash.dto.response.*;
import com.endava.cashflash.security.AuthPrincipal;
import com.endava.cashflash.service.AdminService;
import com.endava.cashflash.service.KycUpgradeService;
import com.endava.cashflash.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping(ApiPaths.ADMIN_BASE)
// Exposes admin management and dashboard endpoints.
public class AdminController {

    private final AdminService adminService;
    private final TransactionService transactionService;
    private final KycUpgradeService kycUpgradeService;

    // Returns admin dashboard overview stats
    @GetMapping(ApiPaths.ADMIN_STATS)
    public AdminOverviewResponse overview() {
        return adminService.getOverview();
    }

    // Deactivates a user by the authenticated admin
    @PutMapping(ApiPaths.ADMIN_USER_DEACTIVATE)
    public DeactivateUserResponse deactivateUser(
            @AuthenticationPrincipal AuthPrincipal principal,
            @Valid @RequestBody DeactivateUserRequest request
    ) {
        return adminService.deactivateUser(principal.getUserId(), request);
    }

    // Activates a user by the authenticated admin
    @PutMapping(ApiPaths.ADMIN_USER_ACTIVATE)
    public ActivateUserResponse activateUser(
            @AuthenticationPrincipal AuthPrincipal principal,
            @Valid @RequestBody ActivateUserRequest request
    ) {
        return adminService.activateUser(principal.getUserId(), request);
    }

    // Returns all users for admin
    @GetMapping(ApiPaths.ADMIN_ALL_USERS)
    public List<AdminUserResponse> getAllUsers() {
        return adminService.getAllUsers();
    }

    // Returns all pending KYC upgrade requests
    @GetMapping(ApiPaths.ADMIN_KYC_UPGRADE_PENDING)
    public List<PendingKycUpgradeResponse> getPendingKycUpgrades() {
        return kycUpgradeService.getPendingKycUpgrades();
    }

    // Reviews and updates a user's KYC status
    @PostMapping(ApiPaths.ADMIN_KYC_UPGRADE_REVIEW)
    public AdminReviewKycUpgradeResponse reviewKycUpgrade(
            @Valid @RequestBody AdminReviewKycUpgradeRequest request
    ) {
        return kycUpgradeService.reviewKycUpgrade(request);
    }

    // All transactions
    @GetMapping(ApiPaths.ADMIN_TRANSACTIONS_ALL)
    public List<AllTransactionResponseDto> getAllTransactions () {
        return transactionService.getAllTransactions ();
    }

    // Returns the uploaded KYC document as a PDF resource
    @GetMapping(value = ApiPaths.ADMIN_KYC_UPGRADE_DOCUMENT, produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<Resource> getKycUpgradeDocument(
            @RequestParam Long userId
    ) {
        Resource resource = kycUpgradeService.getKycDocument(userId);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .body(resource);
    }
}
