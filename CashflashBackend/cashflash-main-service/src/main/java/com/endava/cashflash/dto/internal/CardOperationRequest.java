package com.endava.cashflash.dto.internal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CardOperationRequest(
        @NotBlank String token,
        @NotNull BigDecimal amount
) {
}
