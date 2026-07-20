package com.endava.cashflash.dto.response;

public record AddBankAccountResponse(
        String bankName,
        String ifsc,
        String last4,
        String token
) {}
