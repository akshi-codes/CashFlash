package com.endava.cashflash.exception;

public class OtpExpiredException extends CustomException {

    public OtpExpiredException() {
        super(
                "OTP_EXPIRED", // Error code when OTP has expired
                "OTP has expired." // Message shown to user
        );
    }
}
