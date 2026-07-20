package com.endava.cashflash.dto.response;

import com.endava.cashflash.enums.IdentifierType;

public record AddContactResponse (
        Long contactId,
        Long userId,
        String alias,
        IdentifierType identifierType,
        String identifierValue,
        Boolean isTrusted
){}
