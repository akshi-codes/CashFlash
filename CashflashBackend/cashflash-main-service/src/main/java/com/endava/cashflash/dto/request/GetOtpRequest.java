package com.endava.cashflash.dto.request;

import com.endava.cashflash.constants.ErrorMessages;
import com.endava.cashflash.constants.Patterns;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record GetOtpRequest(
        @NotBlank(message = ErrorMessages.INVALID_EMAIL)
        @Pattern(regexp = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)+$", message = ErrorMessages.INVALID_EMAIL)
        String email
) {
    public GetOtpRequest {
        email = email == null ? null : email.trim().toLowerCase();

        if (email != null && !Patterns.EMAIL_PATTERN.matcher(email).matches()) {
            throw new IllegalArgumentException(ErrorMessages.INVALID_EMAIL);
        }
    }
}
