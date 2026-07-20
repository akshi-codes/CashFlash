package com.endava.cashflash.dto.request;

import com.endava.cashflash.constants.ErrorMessages;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record SetPinRequest(
        @NotBlank(message = ErrorMessages.INVALID_PIN)
        @Pattern(regexp = "^\\d{6}$", message = ErrorMessages.INVALID_PIN)
        String pin
) {}
