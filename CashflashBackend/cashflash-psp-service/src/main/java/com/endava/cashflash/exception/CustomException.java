package com.endava.cashflash.exception;

import lombok.Getter;

@Getter
// Carries PSP-specific error codes with a client-safe message.
public class CustomException extends RuntimeException {

    private final String errorCode;

    public CustomException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
}
