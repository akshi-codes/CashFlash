package com.endava.cashflash.dto.response;

import com.endava.cashflash.enums.ParticipantStatus;

import java.math.BigDecimal;

public record PaymentRequestsResponse(
        Long requestId,
        String name,
        BigDecimal amount,
        ParticipantStatus status,
        Boolean isActive,
        String type
) {}
