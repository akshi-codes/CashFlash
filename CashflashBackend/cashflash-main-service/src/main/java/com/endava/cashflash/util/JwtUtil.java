package com.endava.cashflash.util;

import com.endava.cashflash.constants.SecurityConstants;
import com.endava.cashflash.enums.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
// Creates and validates JWTs used by the main service.
public final class JwtUtil {

    private final SecretKey secretKey;

    public JwtUtil(@Value("${jwt.secret}") String secret) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String generateToken(Long userId, String email, UserRole role) {
        Date now = new Date();
        Date expiry = new Date(System.currentTimeMillis() + SecurityConstants.JWT_EXPIRY);

        return Jwts.builder()
                .subject(String.valueOf(userId))
                .issuedAt(now)
                .expiration(expiry)
                .claim("email", email)
                .claim("role", role.name())
                .signWith(secretKey)
                .compact();
    }

    public Claims validate(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Long extractUserId(String token) {
        Claims claims = validate(token);
        return Long.valueOf(claims.getSubject());
    }
}
