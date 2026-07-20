package com.endava.cashflash.dto.request;

import com.endava.cashflash.constants.ErrorMessages;
import com.endava.cashflash.constants.Patterns;
import com.endava.cashflash.enums.MerchantCategory;
import com.endava.cashflash.exception.InvalidFieldException;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MerchantUpgradeRequest(
        @NotBlank String businessName,
        @NotNull MerchantCategory category,
        @NotBlank String gstin
) {
    public MerchantUpgradeRequest {

        gstin = gstin == null ? null : gstin.trim().toUpperCase();

        if (gstin == null || !Patterns.GSTIN_PATTERN.matcher(gstin).matches()) {
            throw new InvalidFieldException(ErrorMessages.INVALID_GSTIN);
        }
    }
}
