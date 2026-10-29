package com.endava.cashflash.constants;

import java.util.List;
import java.util.stream.Stream;

public final class CorsConstants {

    private CorsConstants() {}

    // Allowed origins
    public static final List<String> ALLOWED_ORIGINS = List.of(
            "http://localhost:25174",
            "http://localhost:25175",
            "http://127.0.0.1:25174",
            "http://127.0.0.1:25175",
            "http://172.26.204.51:25174",
            "http://172.26.204.51:25175"
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

    public static List<String> originsWithAdditional(String additionalOrigins) {
        return Stream.concat(
                ALLOWED_ORIGINS.stream(),
                Stream.of(additionalOrigins.split(","))
                        .map(String::trim)
                        .filter(origin -> !origin.isEmpty())
        ).distinct().toList();
    }
}
