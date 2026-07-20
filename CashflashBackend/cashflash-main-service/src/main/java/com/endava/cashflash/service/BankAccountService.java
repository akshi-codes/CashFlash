package com.endava.cashflash.service;

import com.endava.cashflash.dto.request.AddBankAccountRequest;
import com.endava.cashflash.dto.request.BankAccountBalanceRequest;
import com.endava.cashflash.dto.response.AddBankAccountResponse;
import com.endava.cashflash.dto.response.BankAccountBalanceResponse;

// Defines bank-account operations exposed by the main service.
public interface BankAccountService {
    AddBankAccountResponse addBankAccount(Long userId, AddBankAccountRequest request, String authorizationHeader);
    void setDefaultBankAccount(Long bankaccountId, Long userId);
    void deactivateBankAccount(Long bankAccountId, Long userId);
    void activateBankAccount(Long bankAccountId, Long userId);
    BankAccountBalanceResponse bankAccountBalance(Long userId, BankAccountBalanceRequest request, String bearerToken);
}

