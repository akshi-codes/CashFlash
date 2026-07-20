package com.endava.cashflash.dto.response;

import com.endava.cashflash.dto.internal.ServerStatsResponse;

import java.math.BigDecimal;

public record AdminOverviewResponse(
        long totalUsers,
        long totalMerchants,
        long totalTransactions,
        long successfulTransactions,
        long pendingTransactions,
        long failedTransactions,
        BigDecimal totalAmount,
        long uptimeSeconds,
        long loginCount,
        ServerStatsResponse serverStatsResponse
) {
}