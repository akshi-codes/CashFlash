package com.endava.cashflash.controller;

import com.endava.cashflash.constants.ApiPaths;
import com.endava.cashflash.constants.Literals;
import com.endava.cashflash.dto.internal.LastTransactionDto;
import com.endava.cashflash.dto.internal.UserTransactionResponseDto;
import com.endava.cashflash.dto.request.SendMoneyRequest;
import com.endava.cashflash.dto.request.WalletTopUpRequest;
import com.endava.cashflash.dto.request.WalletWithdrawRequest;
import com.endava.cashflash.dto.response.TransactionResultResponse;
import com.endava.cashflash.security.AuthPrincipal;
import com.endava.cashflash.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping(ApiPaths.TRANSACTION_BASE)
// Exposes wallet and transfer transaction endpoints.
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping(ApiPaths.TRANSACTION_TOP_UP)
    public TransactionResultResponse topUpWalletFromBankAccount(
            @AuthenticationPrincipal AuthPrincipal principal,
            @RequestBody @Valid WalletTopUpRequest request,
            @RequestHeader(Literals.AUTHORIZATION) String authorization,
            @RequestHeader(Literals.IDEMPOTENCY_KEY) String idempotencyKey
    ) {
        return transactionService.topUpWalletFromBankAccount(
                principal.getUserId(),
                request,
                authorization,
                idempotencyKey
        );
    }

    @PostMapping(ApiPaths.TRANSACTION_WITHDRAW)
    public TransactionResultResponse withdrawWalletToBankAccount(
            @AuthenticationPrincipal AuthPrincipal principal,
            @RequestBody @Valid WalletWithdrawRequest request,
            @RequestHeader(Literals.AUTHORIZATION) String authorization,
            @RequestHeader(Literals.IDEMPOTENCY_KEY) String idempotencyKey
    ) {
        return transactionService.withdrawWalletToBankAccount(
                principal.getUserId(),
                request,
                authorization,
                idempotencyKey
        );
    }

    @PostMapping(ApiPaths.TRANSACTION_SEND)
    public TransactionResultResponse sendMoney(
            @AuthenticationPrincipal AuthPrincipal principal,
            @RequestHeader(Literals.AUTHORIZATION) String authorization,
            @RequestHeader(Literals.IDEMPOTENCY_KEY) String idempotencyKey,
            @Valid @RequestBody SendMoneyRequest request
    ) {
        return transactionService.sendMoney(
                principal.getUserId(),
                request,
                authorization,
                idempotencyKey
        );
    }

    @GetMapping(ApiPaths.TRANSACTION_USER)
    public List<UserTransactionResponseDto> getUserTransactions(
            @AuthenticationPrincipal AuthPrincipal principal) {

        return transactionService.getUserTransactions(
                principal.getUserId()
        );
    }

    @GetMapping(ApiPaths.TRANSACTION_LAST)
    public ResponseEntity<LastTransactionDto> getLastTransaction(
            @AuthenticationPrincipal AuthPrincipal principal
    ) {
        return ResponseEntity.ok(
                transactionService.getLastTransaction(principal.getUserId())
        );
    }
}

