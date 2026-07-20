package com.endava.cashflash.dto.request;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record SendMoneyRequest(

        @NotBlank String identifier,

        @NotNull
        @Positive
        BigDecimal amount,

        @NotBlank String paymentMethod, // WALLET | BANK | CARD

        Long bankAccountId,

        Long cardId
) {}