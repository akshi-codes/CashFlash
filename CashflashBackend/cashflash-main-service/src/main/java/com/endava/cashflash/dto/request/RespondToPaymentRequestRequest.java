package com.endava.cashflash.dto.request;

import com.endava.cashflash.enums.ParticipantStatus;
import jakarta.validation.constraints.NotNull;

public record RespondToPaymentRequestRequest(
        @NotNull Long requestId,
        @NotNull ParticipantStatus status
) {
}