package com.endava.cashflash.dto.internal;

import com.endava.cashflash.enums.NotificationStatus;

import java.time.Instant;

public record NotificationWebSocket (
        Long notificationId,
        String message,
        NotificationStatus status,
        Instant createdAt
) {}