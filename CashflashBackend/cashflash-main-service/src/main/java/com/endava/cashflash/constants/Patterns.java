package com.endava.cashflash.constants;

import java.util.regex.Pattern;

public final class Patterns {

    private Patterns () {}

    // Patterns
    public static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)+$");

    public static final Pattern PHONE_PATTERN = Pattern.compile("^[6-9]\\d{9}$");

    public static final Pattern HAS_UPPER =  Pattern.compile(".*[A-Z].*");

    public static final Pattern HAS_LOWER = Pattern.compile(".*[a-z].*");

    public static final Pattern HAS_DIGIT = Pattern.compile(".*\\d.*");

    public static final Pattern HAS_SPECIAL = Pattern.compile(".*[^A-Za-z0-9].*");

    public static final Pattern GSTIN_PATTERN = Pattern.compile("^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$");

    public static final Pattern PASSWORD_PATTERN = Pattern.compile("^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$");

    public static final Pattern PIN_PATTERN = Pattern.compile("^\\d{6}$");

    public static final Pattern OTP_PATTERN = Pattern.compile("^\\d{6}$");

}
