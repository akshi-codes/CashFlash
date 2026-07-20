package com.endava.cashflash.dto.response;

import com.endava.cashflash.dto.internal.BankAccountResponse;
import com.endava.cashflash.dto.internal.CardResponse;
import com.endava.cashflash.dto.internal.WalletResponse;

import java.util.List;

public record UserPaymentMethodsResponse(
        WalletResponse wallet,
        List<BankAccountResponse> bankAccounts,
        List<CardResponse> cards
) {}
