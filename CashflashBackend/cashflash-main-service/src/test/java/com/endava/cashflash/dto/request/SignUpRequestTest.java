package com.endava.cashflash.dto.request;

import com.endava.cashflash.exception.InvalidFieldException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SignUpRequestTest {

    @Test
    void constructor_shouldNormalizeEmailAndPhoneNumber() {
        SignUpRequest request = new SignUpRequest(
                "Akshay Shet",
                " AKSHAY@GMAIL.com",
                "9090909090",
                "Password@123"
        );

        assertEquals("Akshay Shet", request.fullName());
        assertEquals("akshay@gmail.com", request.email());
        assertEquals("9090909090", request.phoneNumber());
        assertEquals("Password@123", request.password());
    }

    @Test
    void constructor_shouldThrowExceptionForInvalidEmail() {
        assertThrows(InvalidFieldException.class, () ->
                new SignUpRequest(
                        "Akshay Maruti Shet",
                        "wrong-email",
                        "9876543210",
                        "Password@123"
                )
        );
    }

    @Test
    void constructor_shouldThrowExceptionForWeakPassword() {
        assertThrows(InvalidFieldException.class, () ->
                new SignUpRequest(
                        "Akshay Maruti Shet",
                        "akshay@mail.com",
                        "9876543210",
                        "password"
                )
        );
    }

    @Test
    void constructor_shouldThrowExceptionForInvalidPhoneNumber() {
        assertThrows(InvalidFieldException.class, () ->
                new SignUpRequest(
                        "Akshay Maruti Shet",
                        "akshay@mail.com",
                        "123",
                        "Password@123"
                )
        );
    }

    @Test
    void constructor_shouldThrowExceptionForNullEmail() {
        assertThrows(InvalidFieldException.class, () ->
                new SignUpRequest(
                        "Akshay Maruti Shet",
                        null,
                        "9876543210",
                        "Password@123"
                )
        );
    }

    @Test
    void constructor_shouldThrowExceptionForNullPhoneNumber() {
        assertThrows(InvalidFieldException.class, () ->
                new SignUpRequest(
                        "Akshay Maruti Shet",
                        "akshay@mail.com",
                        null,
                        "Password@123"
                )
        );
    }

    @Test
    void constructor_shouldThrowExceptionForNullPassword() {
        assertThrows(InvalidFieldException.class, () ->
                new SignUpRequest(
                        "Akshay Maruti Shet",
                        "akshay@mail.com",
                        "9876543210",
                        null
                )
        );
    }

    @Test
    void constructor_shouldAcceptPasswordAtMinimumBoundaryWhenValid() {
        SignUpRequest request = new SignUpRequest(
                "Akshay Maruti Shet",
                "akshay@mail.com",
                "9876543210",
                "Aa1@bcde"
        );

        assertEquals("Aa1@bcde", request.password());
    }
}
