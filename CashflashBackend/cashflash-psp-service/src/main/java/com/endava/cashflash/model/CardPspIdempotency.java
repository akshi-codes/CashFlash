package com.endava.cashflash.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Getter
@Setter
@Table(
        name = "card_psp_idempotency",
        uniqueConstraints = @UniqueConstraint(columnNames = {"idempotency_key", "operation"})
)
// Stores PSP responses keyed by card idempotency keys.
public class CardPspIdempotency {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "idempotency_key", nullable = false, length = 80)
    private String idempotencyKey;

    @Column(name = "operation", nullable = false, length = 16)
    private String operation; // DEBIT / CREDIT

    @Column(name = "token", nullable = false, length = 64)
    private String token;

    @Column(name = "amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(name = "reference_id", nullable = false, length = 64)
    private String referenceId;

    @Column(name = "status", nullable = false, length = 16)
    private String status; // SUCCESSFUL / FAILED / PROCESSING

    @Column(name = "created_at", updatable = false, nullable = false)
    private Instant createdAt;

    @PrePersist
    private void prePersist() {
        this.createdAt = Instant.now();
    }
}
