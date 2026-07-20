package com.endava.cashflash.dto.internal;

import jakarta.validation.constraints.NotBlank;

public record BalanceOperationRequest(
        @NotBlank String token
) {}
