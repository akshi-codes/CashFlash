package com.endava.cashflash.exception;

public class NoOtpRequestedException extends CustomException {

    public NoOtpRequestedException() {
        super(
                "NO_OTP_REQUESTED", // Error code when OTP was not generated
                "No OTP request found for this email" // Message shown to user
        );
    }
}
