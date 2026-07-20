package com.endava.cashflash.model;

import com.endava.cashflash.enums.PaymentRequestStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "payment_requests")
public class PaymentRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_request_id")
    private Long paymentRequestId; // Primary key

    @Column(name = "requester_id", nullable = false)
    private Long requesterId; // ID of the user who created the payment request

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "requester_id",
            referencedColumnName = "user_id",
            insertable = false,
            updatable = false
    )
    private User requester; // User who created the payment request

    @Column(name = "total_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO; // Total amount requested

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 64, nullable = false)
    private PaymentRequestStatus status = PaymentRequestStatus.UNPAID; // Current payment request status

    @Column(name = "message", length = 512)
    private String message; // Optional message attached to the request

    @Column(name = "created_at", nullable = false)
    private Instant createdAt; // Timestamp when the payment request was created

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt; // Timestamp when the payment request expires

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = Boolean.TRUE; // Indicates whether the payment request is active

    @PrePersist
    private void prePersist() {
        this.createdAt = Instant.now(); // Sets createdAt automatically on insert
    }
}