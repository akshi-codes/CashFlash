package com.endava.cashflash.exception;

public class InvalidOtpException extends CustomException {

    public InvalidOtpException() {
        super(
                "INVALID_OTP", // Error code when OTP does not match
                "Invalid OTP" // Message shown to user
        );
    }
}
