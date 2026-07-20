package com.endava.cashflash.exception;

import java.time.Instant;

// Shapes structured error responses returned by the PSP service.
public record ErrorResponse(
        String errorCode,
        String message,
        Instant timestamp
) {
}
