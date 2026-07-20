package com.endava.cashflash.dto.internal;

import com.endava.cashflash.enums.IdentifierType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ParticipantShareDto(
        @NotNull IdentifierType identifierType,
        @NotBlank String identifierValue,
        @NotNull BigDecimal shareAmount
) {
}