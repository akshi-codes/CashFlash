package com.endava.cashflash.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// Stores PSP-side card linkage and balance state.
public class CardPsp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long cardPspId;

    @Column(name = "card_number", nullable = false, length = 32)
    private String cardNumber;

    @Column(name = "expiry_month", nullable = false, length = 2)
    private String expiryMonth;

    @Column(name = "expiry_year", nullable = false, length = 4)
    private String expiryYear;

    @Column(name = "last4", nullable = false, length = 4)
    private String last4;

    @Column(name = "provider", nullable = false, length = 64)
    private String provider;

    @Column(name = "card_type", nullable = false, length = 64)
    private String type;

    @Column(name = "token", nullable = false, length = 64)
    private String token;

    @Column(name = "balance", nullable = false, precision = 19, scale = 2)
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = Boolean.TRUE;

    @Column(name = "is_linked", nullable = false)
    private Boolean isLinked = Boolean.FALSE;

    @PrePersist
    private void prePersist() {
        if (this.token == null || this.token.isBlank()) {
            this.token = "card_psp_" + UUID.randomUUID().toString().replace("-", "");
        }
        if (this.last4 == null && this.cardNumber != null && this.cardNumber.length() >= 4) {
            this.last4 = this.cardNumber.substring(this.cardNumber.length() - 4);
        }
    }
}
