package com.endava.cashflash.dto.response;

import com.endava.cashflash.enums.PaymentRequestStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record PaymentRequestResponse(
        Long paymentRequestId,
        Long requesterId,
        BigDecimal totalAmount,
        PaymentRequestStatus status,
        String message,
        Instant createdAt,
        Instant expiresAt,
        Boolean isActive
) {
}
