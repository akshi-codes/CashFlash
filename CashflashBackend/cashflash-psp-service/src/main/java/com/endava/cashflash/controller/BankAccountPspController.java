package com.endava.cashflash.controller;

import com.endava.cashflash.constants.ApiPaths;
import com.endava.cashflash.dto.request.BalanceOperationRequest;
import com.endava.cashflash.dto.request.BankAccountOperationRequest;
import com.endava.cashflash.dto.request.VerifyBankAccountRequest;
import com.endava.cashflash.dto.response.BalanceOperationResponse;
import com.endava.cashflash.dto.response.BankAccountOperationResponse;
import com.endava.cashflash.dto.response.VerifyBankAccountResponse;
import com.endava.cashflash.service.BankAccountPspService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping(ApiPaths.BANK_ACCOUNT_PSP_BASE)
// Exposes PSP bank-account verification and balance operations.
public class BankAccountPspController {

    private final BankAccountPspService bankAccountPspService;

    @PostMapping(ApiPaths.BANK_ACCOUNT_PSP_VERIFY)
    public VerifyBankAccountResponse verifyBankAccount(
            @RequestBody @Valid VerifyBankAccountRequest request
    ) {
        return bankAccountPspService.verifyBankAccount(request);
    }

    @PostMapping(ApiPaths.BANK_ACCOUNT_PSP_DEBIT)
    public BankAccountOperationResponse debitFromBankAccount(
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @RequestBody @Valid BankAccountOperationRequest request
    ) {
        return bankAccountPspService.debitFromBankAccount(idempotencyKey, request);
    }

    @PostMapping(ApiPaths.BANK_ACCOUNT_PSP_CREDIT)
    public BankAccountOperationResponse creditToBankAccount(
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @RequestBody @Valid BankAccountOperationRequest request
    ) {
        return bankAccountPspService.creditToBankAccount(idempotencyKey, request);
    }

    @PostMapping(ApiPaths.BANK_ACCOUNT_PSP_BALANCE)
    public BalanceOperationResponse balance(@RequestBody @Valid BalanceOperationRequest request) {
        return bankAccountPspService.getBalance(request);
    }
}
