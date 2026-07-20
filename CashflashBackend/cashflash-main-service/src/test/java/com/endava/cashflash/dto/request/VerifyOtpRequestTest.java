package com.endava.cashflash.dto.request;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class VerifyOtpRequestTest {

    @Test
    void constructor_shouldNormalizeEmailAndOtp() {
        VerifyOtpRequest request = new VerifyOtpRequest("  USER@MAIL.COM  ", " 123456 ");

        assertEquals("user@mail.com", request.email());
        assertEquals("123456", request.otp());
    }

    @Test
    void constructor_shouldThrowExceptionForInvalidEmail() {
        assertThrows(IllegalArgumentException.class, () -> new VerifyOtpRequest("wrong-email", "123456"));
    }

    @Test
    void constructor_shouldAllowNullEmailForBeanValidationToHandle() {
        VerifyOtpRequest request = new VerifyOtpRequest(null, "123456");

        assertNull(request.email());
        assertEquals("123456", request.otp());
    }
}
