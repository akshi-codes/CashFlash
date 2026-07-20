package com.endava.cashflash.dto.request;

import com.endava.cashflash.constants.ErrorMessages;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record LogInRequest(
        @NotBlank(message = ErrorMessages.INVALID_EMAIL)
        @Pattern(regexp = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)+$", message = ErrorMessages.INVALID_EMAIL)
        String email,
        @NotBlank String password
) {
    public LogInRequest {
        email = email == null ? null : email.trim().toLowerCase();
    }
}
