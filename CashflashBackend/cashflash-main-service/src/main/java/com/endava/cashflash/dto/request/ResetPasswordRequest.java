package com.endava.cashflash.dto.request;

import com.endava.cashflash.constants.ErrorMessages;
import com.endava.cashflash.constants.Patterns;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ResetPasswordRequest (
        @NotBlank(message = ErrorMessages.INVALID_EMAIL)
        @Pattern(regexp = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)+$", message = ErrorMessages.INVALID_EMAIL)
        String email,
        @NotBlank(message = ErrorMessages.WEAK_PASSWORD)
        @Pattern(regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$", message = ErrorMessages.WEAK_PASSWORD)
        String newPassword
) {
    public ResetPasswordRequest {
        email = email == null ? null : email.trim().toLowerCase();
        newPassword = newPassword == null ? null : newPassword.trim();

        if (email != null && !Patterns.EMAIL_PATTERN.matcher(email).matches()) {
            throw new IllegalArgumentException(ErrorMessages.INVALID_EMAIL);
        }
    }
}
