package com.endava.cashflash.dto.internal;

import java.math.BigDecimal;
import java.time.Instant;

import com.endava.cashflash.enums.TransactionDirection;

public record UserTransactionResponseDto(
        Long transactionId,
        String name,
        String transactionType,
        BigDecimal amount,
        String status,
        TransactionDirection direction,
        String referenceId,
        Instant createdAt
) { }
