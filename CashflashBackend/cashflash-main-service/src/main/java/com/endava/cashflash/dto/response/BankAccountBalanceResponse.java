package com.endava.cashflash.dto.response;

import java.math.BigDecimal;

public record BankAccountBalanceResponse(
        Long bankAccountId,
        BigDecimal balance
) {}
