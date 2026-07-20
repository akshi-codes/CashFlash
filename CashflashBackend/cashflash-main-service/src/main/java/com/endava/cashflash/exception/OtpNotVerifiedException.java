package com.endava.cashflash.exception;

public class OtpNotVerifiedException extends CustomException {

    public OtpNotVerifiedException() {
        super(
                "OTP_NOT_VERIFIED", // Error code when OTP was not verified
                "OTP verification required before resetting password" // Message shown to user
        );
    }
}

