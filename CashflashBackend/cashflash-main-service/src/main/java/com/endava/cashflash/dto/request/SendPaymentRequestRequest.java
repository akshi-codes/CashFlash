package com.endava.cashflash.dto.request;

import com.endava.cashflash.dto.internal.ParticipantShareDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record SendPaymentRequestRequest(
        @NotNull BigDecimal totalAmount,
        Instant expiresAt,
        String message,
        @NotEmpty @Valid List<ParticipantShareDto> participants
) {
}