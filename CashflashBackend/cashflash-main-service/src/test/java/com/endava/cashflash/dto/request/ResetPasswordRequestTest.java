package com.endava.cashflash.dto.request;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ResetPasswordRequestTest {

    @Test
    void constructor_shouldNormalizeEmailAndPassword() {
        ResetPasswordRequest request = new ResetPasswordRequest("  USER@MAIL.COM  ", "  Password@123  ");

        assertEquals("user@mail.com", request.email());
        assertEquals("Password@123", request.newPassword());
    }

    @Test
    void constructor_shouldThrowExceptionForInvalidEmail() {
        assertThrows(IllegalArgumentException.class, () -> new ResetPasswordRequest("wrong-email", "Password@123"));
    }

    @Test
    void constructor_shouldAllowNullEmailForBeanValidationToHandle() {
        ResetPasswordRequest request = new ResetPasswordRequest(null, "Password@123");

        assertNull(request.email());
        assertEquals("Password@123", request.newPassword());
    }
}
