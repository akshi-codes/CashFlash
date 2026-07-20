package com.endava.cashflash.controller;

import com.endava.cashflash.constants.ApiPaths;
import com.endava.cashflash.dto.response.WalletDetailsResponse;
import com.endava.cashflash.security.AuthPrincipal;
import com.endava.cashflash.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping(ApiPaths.WALLET_BASE)
// Exposes wallet summary endpoints for authenticated users.
public class WalletController {

    private final WalletService walletService;

    @GetMapping(ApiPaths.WALLET_DETAILS)
    public WalletDetailsResponse getWalletDetails(
            @AuthenticationPrincipal AuthPrincipal principal
    ) {
        return walletService.getWalletDetails(principal.getUserId());
    }
}
