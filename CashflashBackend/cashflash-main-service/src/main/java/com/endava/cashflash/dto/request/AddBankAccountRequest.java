package com.endava.cashflash.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AddBankAccountRequest(
        @NotBlank String accountNumber,
        @NotBlank String ifsc,
        Boolean isDefault
) {}
