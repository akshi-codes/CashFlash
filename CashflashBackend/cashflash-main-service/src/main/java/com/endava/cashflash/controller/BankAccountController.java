package com.endava.cashflash.controller;

import com.endava.cashflash.constants.ApiPaths;
import com.endava.cashflash.constants.Literals;
import com.endava.cashflash.dto.request.AddBankAccountRequest;
import com.endava.cashflash.dto.request.BankAccountBalanceRequest;
import com.endava.cashflash.dto.response.AddBankAccountResponse;
import com.endava.cashflash.dto.response.BankAccountBalanceResponse;
import com.endava.cashflash.security.AuthPrincipal;
import com.endava.cashflash.service.BankAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping(ApiPaths.BANK_ACCOUNT_BASE)
// Exposes bank-account endpoints for authenticated users.
public class BankAccountController {

    private final BankAccountService bankAccountService;

    @PostMapping(ApiPaths.BANK_ACCOUNT_ADD)
    public AddBankAccountResponse addBankAccount(
            @AuthenticationPrincipal AuthPrincipal principal,
            @RequestBody @Valid AddBankAccountRequest request,
            @RequestHeader(value = Literals.AUTHORIZATION) String authorization
    ) {
        return bankAccountService.addBankAccount(principal.getUserId(), request, authorization);
    }

    @PostMapping(ApiPaths.BANK_ACCOUNT_BALANCE)
    public BankAccountBalanceResponse bankAccountBalance(
            @AuthenticationPrincipal AuthPrincipal principal,
            @RequestBody @Valid BankAccountBalanceRequest request,
            @RequestHeader(value = Literals.AUTHORIZATION) String authorization
    ) {
        return bankAccountService.bankAccountBalance(principal.getUserId(), request, authorization);
    }
}
