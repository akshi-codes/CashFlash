package com.endava.cashflash.exception;

public class InvalidEmailException extends CustomException {

    public InvalidEmailException() {
        super(
                "INVALID_CREDENTIALS", // Error code for login failure
                "Email does not exist" // Message shown when credentials are wrong
        );
    }
}
