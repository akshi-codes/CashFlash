package com.endava.cashflash.dto.request;

import jakarta.validation.constraints.NotNull;

public record CancelPaymentRequestRequest(
        @NotNull Long requestId
) {}