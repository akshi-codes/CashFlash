package com.endava.cashflash.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record WalletToBankAccountRequest(
        @NotNull Long userId,
        @NotNull @Positive BigDecimal amount
) {}


