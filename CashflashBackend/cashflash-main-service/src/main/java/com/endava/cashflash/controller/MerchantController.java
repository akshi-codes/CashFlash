package com.endava.cashflash.controller;

import com.endava.cashflash.constants.ApiPaths;
import com.endava.cashflash.dto.request.MerchantUpgradeRequest;
import com.endava.cashflash.dto.response.MerchantUpgradeResponse;
import com.endava.cashflash.security.AuthPrincipal;
import com.endava.cashflash.service.MerchantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping(ApiPaths.MERCHANT_BASE)
// Serves merchant onboarding and lookup endpoints.
public class MerchantController {

    private final MerchantService merchantService; // Service that handles user upgrade logic

    @PostMapping(ApiPaths.MERCHANT_UPGRADE)
    public MerchantUpgradeResponse signUp(
            @AuthenticationPrincipal AuthPrincipal principal,
            @Valid @RequestBody MerchantUpgradeRequest request
    ) { // Accepts signup request data
        return merchantService.upgradeToMerchant(principal.getUserId(), request);  // Returns signup response from service
    }
}

