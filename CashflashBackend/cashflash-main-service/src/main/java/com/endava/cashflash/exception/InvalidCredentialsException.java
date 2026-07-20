package com.endava.cashflash.exception;

public class InvalidCredentialsException extends CustomException {

    public InvalidCredentialsException() {
        super(
                "INVALID_CREDENTIALS", // Error code for login failure
                "Invalid email or password" // Message shown when credentials are wrong
        );
    }
}
