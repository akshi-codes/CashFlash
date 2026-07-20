package com.endava.cashflash.dto.internal;

public record ServerStatsResponse(
        double heapUsedBytes,
        double heapMaxBytes,
        double nonHeapUsedBytes,
        double liveThreads,
        double processCpuUsage,   // 0..1
        double systemCpuUsage,    // 0..1
        long httpRequestsTotal,
        long http2xx,
        long http4xx,
        long http5xx,
        double httpAvgMs,
        double httpMaxMs
) {
}