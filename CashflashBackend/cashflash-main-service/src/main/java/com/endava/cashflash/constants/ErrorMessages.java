package com.endava.cashflash.constants;

public final class ErrorMessages {

    private ErrorMessages () {}

    // Error messages
    public static final String AUTH_TOKEN_REQUIRED = "Authorization token is required";
    public static final String IDEMPOTENCY_KEY_REQUIRED = "Idempotency-Key is required";
    public static final String INVALID_IDENTIFIER = "Invalid Identifier";
    public static final String INVALID_AMOUNT = "Amount must be greater than 0";
    public static final String INVALID_GSTIN = "Invalid GSTIN";
    public static final String INVALID_EMAIL = "Invalid email";
    public static final String INVALID_PHONE_NUMBER = "Invalid phone number";
    public static final String WEAK_PASSWORD = "Weak password";
    public static final String INVALID_PIN = "PIN must be exactly 6 digits";
    public static final String INVALID_OTP = "OTP must be exactly 6 digits";
}
