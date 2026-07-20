package com.endava.cashflash.dto.internal;

import com.endava.cashflash.enums.CardType;
import com.endava.cashflash.enums.Provider;

public record CardResponse (
    Long cardId,
    String last4,
    Provider provider,
    CardType type,
    String expiryMonth,
    String expiryYear,
    Boolean isDefault,
    Boolean isActive
) {}
