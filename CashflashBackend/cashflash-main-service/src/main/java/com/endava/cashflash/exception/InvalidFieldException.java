package com.endava.cashflash.exception;

public class InvalidFieldException extends CustomException {

    public InvalidFieldException(String message) {
        super(
                "INVALID_FIELD", // Error code
                message // Message shown to user
        );
    }
}
