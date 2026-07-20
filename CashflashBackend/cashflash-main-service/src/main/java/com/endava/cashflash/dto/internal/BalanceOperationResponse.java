package com.endava.cashflash.dto.internal;

import java.math.BigDecimal;

public record BalanceOperationResponse(
        BigDecimal balance
) {}
