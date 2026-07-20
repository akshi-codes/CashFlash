package com.endava.cashflash.exception;

import com.endava.cashflash.constants.NumericalConstants;

public class OtpAttemptsExceededException extends CustomException {

    public OtpAttemptsExceededException() {
        super(
                "OTP_ATTEMPTS_EXCEEDED", // Error code when max attempts reached
                "Maximum OTP attempts (%d) exceeded.".formatted(NumericalConstants.OTP_ATTEMPTS)// Message shown to use
        );
    }
}
