package com.endava.cashflash.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

public record WalletDetailsResponse(
        Long walletId,
        BigDecimal balance,
        BigDecimal flashPotBalance,
        Instant updatedAt,
        Boolean isActive,
        Boolean isFrozen
) {}
