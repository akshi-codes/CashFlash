package com.endava.cashflash.service;

import com.endava.cashflash.dto.request.BalanceOperationRequest;
import com.endava.cashflash.dto.request.BankAccountOperationRequest;
import com.endava.cashflash.dto.request.VerifyBankAccountRequest;
import com.endava.cashflash.dto.response.BalanceOperationResponse;
import com.endava.cashflash.dto.response.BankAccountOperationResponse;
import com.endava.cashflash.dto.response.VerifyBankAccountResponse;

// Defines PSP bank-account verification and balance operations.
public interface BankAccountPspService {
    VerifyBankAccountResponse verifyBankAccount(VerifyBankAccountRequest request);
    BankAccountOperationResponse debitFromBankAccount(String idempotencyKey, BankAccountOperationRequest request);
    BankAccountOperationResponse creditToBankAccount(String idempotencyKey, BankAccountOperationRequest request);
    BalanceOperationResponse getBalance(BalanceOperationRequest request);
}
