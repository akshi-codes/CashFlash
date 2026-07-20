package com.endava.cashflash.dto.request;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class LogInRequestTest {

    @Test
    void constructor_shouldNormalizeEmail() {
        LogInRequest request = new LogInRequest("  USER@MAIL.COM  ", "Password@123");

        assertEquals("user@mail.com", request.email());
        assertEquals("Password@123", request.password());
    }

    @Test
    void constructor_shouldAllowNullEmailForBeanValidationToHandle() {
        LogInRequest request = new LogInRequest(null, "Password@123");

        assertNull(request.email());
        assertEquals("Password@123", request.password());
    }
}
