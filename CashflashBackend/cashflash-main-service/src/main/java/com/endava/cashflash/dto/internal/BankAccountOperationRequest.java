package com.endava.cashflash.dto.internal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record BankAccountOperationRequest(
        @NotBlank String token,
        @NotNull BigDecimal amount
) {}
