package com.endava.cashflash.dto.response;

import java.math.BigDecimal;
import jakarta.validation.constraints.NotNull;

public record BalanceOperationResponse(
        @NotNull BigDecimal balance
) {}