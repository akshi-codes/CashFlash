package com.endava.cashflash.constants;

public final class NumericalConstants {

    private NumericalConstants() {}

    // Numerical constants
    public static final int OTP_LENGTH = 6; // OTP digits length
    public static final int OTP_EXPIRY = 120; // 120 seconds
    public static final int OTP_ATTEMPTS = 3; // Max attempts
    public static final int  MAX_ATTEMPTS = 3; // Max allowed failed attempts
    public static final long MAX_CACHE_SIZE = 10_000; // Max cache size for caffeine
    public static final long CACHE_EXPIRY = 10; // Minutes
    public static final String FEE_RATE = "0.005";
    public static final String TAX_RATE = "0.0";
}
