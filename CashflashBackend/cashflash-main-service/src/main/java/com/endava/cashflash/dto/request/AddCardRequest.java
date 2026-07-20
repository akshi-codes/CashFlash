package com.endava.cashflash.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AddCardRequest(
        @NotBlank String cardNumber,
        @NotBlank String expiryMonth,
        @NotBlank String expiryYear,
        @NotBlank String cvv,
        Boolean isDefault
) {}