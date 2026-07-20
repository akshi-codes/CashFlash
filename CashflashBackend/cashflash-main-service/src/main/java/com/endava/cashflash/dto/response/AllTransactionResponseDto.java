package com.endava.cashflash.dto.response;

import java.math.BigDecimal;

public record AllTransactionResponseDto(
        Long transactionId,
        String senderName,
        String receiverName,
        String transactionType,
        BigDecimal amount,
        String status,
        String referenceId,
        java.time.Instant createdAt
) {
}