package com.endava.cashflash.dto.request;

import jakarta.validation.constraints.NotBlank;

public record VerifyBankAccountRequest(
        @NotBlank String accountNumber,
        @NotBlank String ifsc
) {}
