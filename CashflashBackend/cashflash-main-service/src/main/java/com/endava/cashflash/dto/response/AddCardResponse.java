package com.endava.cashflash.dto.response;

import com.endava.cashflash.enums.CardType;
import com.endava.cashflash.enums.Provider;

public record AddCardResponse(
        String last4,
        Provider provider,
        CardType type,
        String expiryMonth,
        String expiryYear,
        String token
) {}
