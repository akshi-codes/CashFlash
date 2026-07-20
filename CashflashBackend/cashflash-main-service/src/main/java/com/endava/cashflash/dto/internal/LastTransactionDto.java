package com.endava.cashflash.dto.internal;

import java.math.BigDecimal;
import java.time.Instant;

import com.endava.cashflash.enums.TransactionStatus;

public record LastTransactionDto(
        String direction,
        BigDecimal amount,
        BigDecimal finalAmount,
        TransactionStatus status,
        Instant timestamp
) { }
