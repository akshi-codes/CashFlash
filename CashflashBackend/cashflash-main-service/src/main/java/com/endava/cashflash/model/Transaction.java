package com.endava.cashflash.model;

import com.endava.cashflash.enums.DestinationType;
import com.endava.cashflash.enums.SourceType;
import com.endava.cashflash.enums.TransactionStatus;
import com.endava.cashflash.enums.TransactionType;
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
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transaction_id")
    private Long transactionId; // Primary key

    @Column(name = "sender_id", nullable = false)
    private Long senderId; // ID of the transaction sender

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false)
    private SourceType sourceType; // Type of source initiating the transaction

    @Column(name = "receiver_id", nullable = false)
    private Long receiverId; // ID of the transaction receiver

    @Enumerated(EnumType.STRING)
    @Column(name = "destination_type", nullable = false)
    private DestinationType destinationType; // Type of destination receiving the transaction

    @Column(name = "reference_id", nullable = false, unique = true, length = 64)
    private String referenceId; // Unique transaction reference

    @Column(name = "idempotency_key", nullable = false, unique = true, length = 64)
    private String idempotencyKey; // Unique key to prevent duplicate transaction processing

    @Column(name = "amount", precision = 19, scale = 2, nullable = false)
    private BigDecimal amount; // Original transaction amount

    @Column(name = "fee_amount", precision = 19, scale = 2)
    private BigDecimal feeAmount; // Fee charged for the transaction

    @Column(name = "tax_amount", precision = 19, scale = 2)
    private BigDecimal taxAmount; // Tax charged for the transaction

    @Column(name = "final_amount", precision = 19, scale = 2)
    private BigDecimal finalAmount; // Final amount after fee and tax calculation

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private TransactionStatus status; // Current transaction status

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false)
    private TransactionType transactionType; // Type of transaction being performed

    @Column(name = "description", length = 512)
    private String description; // Optional transaction description

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt; // Timestamp when the transaction was created

    @PrePersist
    void prePersist() {
        this.createdAt = Instant.now(); // Sets createdAt automatically on insert
    }
}