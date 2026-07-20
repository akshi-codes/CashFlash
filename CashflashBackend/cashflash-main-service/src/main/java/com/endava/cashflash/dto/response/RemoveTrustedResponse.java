package com.endava.cashflash.dto.response;

public record RemoveTrustedResponse(
        Long contactId,
        Boolean isTrusted
) {}
