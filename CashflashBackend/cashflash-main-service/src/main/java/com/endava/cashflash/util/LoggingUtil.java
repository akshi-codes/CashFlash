package com.endava.cashflash.util;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jspecify.annotations.NonNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
// Logs request method, path, status, and latency for each HTTP call.
public final class LoggingUtil extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(LoggingUtil.class);

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        long start = System.currentTimeMillis();
        try {
            filterChain.doFilter(request, response);
        } finally {
            long ms = System.currentTimeMillis() - start;
            String method = request.getMethod();
            String uri = request.getRequestURI();
            String qs = request.getQueryString();
            int status = response.getStatus();

            log.info("{} {}{} -> {} ({}ms)",
                    method,
                    uri,
                    (qs == null ? "" : "?" + qs),
                    status,
                    ms
            );
        }
    }
}
