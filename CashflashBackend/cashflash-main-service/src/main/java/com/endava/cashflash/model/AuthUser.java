package com.endava.cashflash.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "auth_users")
public class AuthUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "auth_user_id")
    private Long authUserId; // Primary key

    @NotBlank
    @Column(name = "password_hash", nullable = false, length = 512)
    private String passwordHash; // Stores the hashed password

    @Column(name = "pin_hash", length = 512)
    private String pinHash; // Stores the hashed pin

    @Column(name = "otp_hash", length = 512)
    private String otpHash; // Stores the hashed OTP

    @Column(name = "last_login")
    private Instant lastLoginAt; // Timestamp of the most recent successful login

    @Column(name = "pin_attempts", nullable = false)
    private Integer pinAttempts = 0; // Tracks consecutive failed login attempts

    @Column(name = "last_failed_at")
    private Instant lastFailedPinAttempt; // To calculate cool-off time

    @Column(name = "password_changed_at")
    private Instant passwordChangedAt; // To force reset

    @Column(name = "otp_expires_at")
    private Instant otpExpiresAt; // Timestamp when the OTP expires

    @Column(name = "otp_attempts", nullable = false)
    private Integer otpAttempts = 0; // Tracks number of OTP verification attempts

    @Column(name = "otp_last_sent_at")
    private Instant otpLastSentAt; // Timestamp when the OTP was last generated

    @Column(name = "otp_verified_at")
    private Instant otpVerifiedAt; // Timestamp when OTP was successfully verified

    @Column(name = "is_logged_in", nullable = false)
    private Boolean isLoggedIn = Boolean.FALSE; // Indicates if the user is currently logged in

    @Column(name = "is_locked", nullable = false)
    private Boolean isLocked = Boolean.FALSE; // Indicates if the account is locked due to failures

    @NotNull
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user; // Links the auth record to exactly one user
}
