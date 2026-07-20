package com.endava.cashflash.dto.response;

public record VerifyBankAccountResponse(
        String bankName,
        String ifsc,
        String last4,
        String token
) {}
