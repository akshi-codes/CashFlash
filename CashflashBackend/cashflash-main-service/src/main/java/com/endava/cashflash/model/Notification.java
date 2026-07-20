package com.endava.cashflash.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

import com.endava.cashflash.enums.NotificationStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Long notificationId; // Primary key

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user; // User who owns this notification

    @Column(name = "message", length = 1024)
    private String message; // Notification message content

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 32)
    private NotificationStatus status; // Current notification status

    @Column(name = "created_at")
    private Instant createdAt; // Timestamp when the notification was created

    @PrePersist
    private void prePersist() {
        this.createdAt = Instant.now(); // Sets createdAt automatically on insert
    }
}