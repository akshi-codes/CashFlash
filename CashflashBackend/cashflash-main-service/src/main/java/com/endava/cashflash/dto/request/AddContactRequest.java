package com.endava.cashflash.dto.request;

import com.endava.cashflash.enums.IdentifierType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AddContactRequest(
        @NotBlank String alias,
        @NotNull IdentifierType identifierType,
        @NotBlank String identifierValue
) {}
