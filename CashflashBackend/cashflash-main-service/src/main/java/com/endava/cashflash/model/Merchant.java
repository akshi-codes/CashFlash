package com.endava.cashflash.model;

import com.endava.cashflash.enums.MerchantCategory;
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
@Table(name = "merchants")
public class Merchant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "merchant_id")
    private Long merchantId; // Primary key for merchant

    @NotBlank
    @Column(name = "business_name", nullable = false, length = 128)
    private String businessName; // Merchant's business name

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private MerchantCategory category; // Select one from enum class

    @NotBlank
    @Column(name = "gstin", nullable = false, unique = true, length = 15)
    private String gstin; // GST Number, unique like email and phone number

    @Column(name = "created_at", updatable = false)
    private Instant createdAt; // Timestamp when the record was created

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt; // Timestamp when the record was last updated

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = Boolean.TRUE;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @PrePersist
    private void prePersist() { // On create
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    private void preUpdate() { // On update
        this.updatedAt = Instant.now();
    }
}
