package com.endava.cashflash.exception;

import lombok.Getter;

@Getter
public class CustomException extends RuntimeException {

    private final String errorCode; // Stores an application-specific error code

    public CustomException(String errorCode, String message) {
        super(message); // Sets the exception message
        this.errorCode = errorCode; // Sets the error code
    }
}
