package com.endava.cashflash.config;

import com.endava.cashflash.constants.ApiPaths;
import com.endava.cashflash.constants.CorsConstants;
import com.endava.cashflash.constants.Literals;
import com.endava.cashflash.constants.SecurityConstants;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.endava.cashflash.security.JwtAuthenticationFilter;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
// Configures stateless security rules and JWT-based authentication.
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${app.cors.additional-origins:}")
    private String additionalCorsOrigins;

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) {

        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST, ApiPaths.USER_SIGN_UP).permitAll()
                        .requestMatchers(HttpMethod.POST, ApiPaths.AUTH_USER_LOG_IN).permitAll()
                        .requestMatchers(HttpMethod.POST, ApiPaths.AUTH_USER_GET_OTP).permitAll()
                        .requestMatchers(HttpMethod.POST, ApiPaths.AUTH_USER_VERIFY_OTP).permitAll()
                        .requestMatchers(HttpMethod.POST, ApiPaths.AUTH_USER_RESET_PASSWORD).permitAll()
                        .requestMatchers(ApiPaths.WEBSOCKET).permitAll()
                        .requestMatchers(ApiPaths.PROFILE_FILES).permitAll()
                        .requestMatchers(ApiPaths.ACTUATOR).permitAll()
                        .requestMatchers(ApiPaths.METRICS_DEMO).permitAll()
                        .requestMatchers(ApiPaths.ADMIN).hasRole(Literals.ADMIN)
                        .anyRequest().authenticated()
                )
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(CorsConstants.originsWithAdditional(additionalCorsOrigins));
        config.setAllowedMethods(CorsConstants.ALLOWED_METHODS);
        config.setAllowedHeaders(CorsConstants.ALLOWED_HEADERS);
        config.setAllowCredentials(CorsConstants.ALLOW_CREDENTIALS);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration(ApiPaths.API_WILDCARD, config);

        return source;
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(SecurityConstants.BCRYPT_STRENGTH);
    }
}
