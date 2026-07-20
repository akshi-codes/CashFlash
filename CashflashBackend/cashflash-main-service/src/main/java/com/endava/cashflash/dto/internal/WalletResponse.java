package com.endava.cashflash.dto.internal;

import java.math.BigDecimal;
import java.time.Instant;

public record WalletResponse (
        Long walletId,
        BigDecimal balance,
        BigDecimal flashPotBalance,
        Instant updatedAt,
        Boolean isActive,
        Boolean isFrozen
) {}
