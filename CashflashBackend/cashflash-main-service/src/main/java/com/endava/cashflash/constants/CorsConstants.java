package com.endava.cashflash.constants;

import java.util.List;

public final class CorsConstants {

    private CorsConstants() {}

    // Allowed origins
    public static final List<String> ALLOWED_ORIGINS = List.of(
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://172.26.204.51:5173",
            "http://172.26.204.51:5174",
            "http://172.26.204.51:5175"
    );

    // Allowed methods
    public static final List<String> ALLOWED_METHODS = List.of(
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "OPTIONS"
    );

    // Allowed headers
    public static final List<String> ALLOWED_HEADERS = List.of("*");

    // Allowed credentials
    public static final boolean ALLOW_CREDENTIALS = true;
}
