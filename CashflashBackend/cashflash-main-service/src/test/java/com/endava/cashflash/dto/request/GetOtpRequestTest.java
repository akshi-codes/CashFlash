package com.endava.cashflash.dto.request;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class GetOtpRequestTest {

    @Test
    void constructor_shouldNormalizeEmail() {
        GetOtpRequest request = new GetOtpRequest("  USER@MAIL.COM  ");

        assertEquals("user@mail.com", request.email());
    }

    @Test
    void constructor_shouldThrowExceptionForInvalidEmail() {
        assertThrows(IllegalArgumentException.class, () -> new GetOtpRequest("wrong-email"));
    }

    @Test
    void constructor_shouldAllowNullEmailForBeanValidationToHandle() {
        GetOtpRequest request = new GetOtpRequest(null);

        assertNull(request.email());
    }
}
