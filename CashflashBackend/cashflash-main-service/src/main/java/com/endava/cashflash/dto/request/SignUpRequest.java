package com.endava.cashflash.dto.request;

import com.endava.cashflash.constants.ErrorMessages;
import com.endava.cashflash.constants.Patterns;
import com.endava.cashflash.exception.InvalidFieldException;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record SignUpRequest(
        @NotBlank(message = "Full name is required")
        String fullName,

        @NotBlank(message = ErrorMessages.INVALID_EMAIL)
        @Pattern(regexp = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)+$", message = ErrorMessages.INVALID_EMAIL)
        String email,

        @NotBlank(message = ErrorMessages.INVALID_PHONE_NUMBER)
        @Pattern(regexp = "^[6-9]\\d{9}$", message = ErrorMessages.INVALID_PHONE_NUMBER)
        String phoneNumber,

        @NotBlank(message = ErrorMessages.WEAK_PASSWORD)
        @Pattern(regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$", message = ErrorMessages.WEAK_PASSWORD)
        String password
) {

    public SignUpRequest {
        fullName = fullName == null ? null : fullName.trim();
        email = email == null ? null : email.trim().toLowerCase();
        phoneNumber = phoneNumber == null ? null : phoneNumber.trim();
        password = password == null ? null : password.trim();

        if (email != null && !Patterns.EMAIL_PATTERN.matcher(email).matches()) {
            throw new InvalidFieldException(ErrorMessages.INVALID_EMAIL);
        }

        if (phoneNumber != null && !Patterns.PHONE_PATTERN.matcher(phoneNumber).matches()) {
            throw new InvalidFieldException(ErrorMessages.INVALID_PHONE_NUMBER);
        }

        if (password != null && !Patterns.PASSWORD_PATTERN.matcher(password).matches()) {
            throw new InvalidFieldException(ErrorMessages.WEAK_PASSWORD);
        }
    }
}
