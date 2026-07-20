package com.endava.cashflash.dto.response;

public record SetTrustedResponse(
        Long contactId,
        Boolean isTrusted
) {}
