package com.endava.cashflash.dto.response;

public record VerifyCardResponse(
        String provider,
        String type,
        String last4,
        String expiryMonth,
        String expiryYear,
        String token
) {}
