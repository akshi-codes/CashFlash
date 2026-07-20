package com.endava.cashflash.dto.request;

import com.endava.cashflash.constants.ErrorMessages;
import com.endava.cashflash.constants.Patterns;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerifyOtpRequest(
        @NotBlank(message = ErrorMessages.INVALID_EMAIL)
        @Pattern(regexp = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)+$", message = ErrorMessages.INVALID_EMAIL)
        String email,
        @NotBlank(message = ErrorMessages.INVALID_OTP)
        @Pattern(regexp = "^\\d{6}$", message = ErrorMessages.INVALID_OTP)
        String otp
) {
    public VerifyOtpRequest {
        email = email == null ? null : email.trim().toLowerCase();
        otp = otp == null ? null : otp.trim();

        if (email != null && !Patterns.EMAIL_PATTERN.matcher(email).matches()) {
            throw new IllegalArgumentException(ErrorMessages.INVALID_EMAIL);
        }
    }
}
