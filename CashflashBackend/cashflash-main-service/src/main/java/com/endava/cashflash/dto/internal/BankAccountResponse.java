package com.endava.cashflash.dto.internal;

public record BankAccountResponse(
        Long bankAccountId,
        String last4,
        String bankName,
        String ifsc,
        Boolean isDefault,
        Boolean isActive
) {}
