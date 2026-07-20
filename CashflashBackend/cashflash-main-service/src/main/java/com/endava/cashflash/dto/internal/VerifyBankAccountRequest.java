package com.endava.cashflash.dto.internal;

import jakarta.validation.constraints.NotBlank;

public record VerifyBankAccountRequest(
        @NotBlank String accountNumber,
        @NotBlank String ifsc
) {}
