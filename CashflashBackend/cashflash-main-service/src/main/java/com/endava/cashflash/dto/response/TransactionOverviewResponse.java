package com.endava.cashflash.dto.response;

import java.math.BigDecimal;

public record TransactionOverviewResponse(
        long total,
        long successful,
        long pending,
        long failed,
        BigDecimal totalAmount
) {}