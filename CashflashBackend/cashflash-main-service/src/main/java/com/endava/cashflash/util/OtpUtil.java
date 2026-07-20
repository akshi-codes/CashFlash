package com.endava.cashflash.util;

import com.endava.cashflash.constants.NumericalConstants;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;

@Component
public final class OtpUtil {

    private static final SecureRandom RANDOM = new SecureRandom(); // Secure random generator for OTPs

    public String generateOtp() { // Generates an OTP using configured digit length
        int length = NumericalConstants.OTP_LENGTH;
        int min = (int) Math.pow(10, length - 1);
        int bound = (int) Math.pow(10, length) - min;
        int otp = min + RANDOM.nextInt(bound);
        return String.valueOf(otp); // Returns OTP as string
    }
}
