package com.endava.cashflash.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// Represents a PSP-side bank account mirror.
public class BankAccountPsp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bank_account_psp_id")
    private Long bankAccountPspId;

    @Column(name = "bank_name", nullable = false, length = 128)
    private String bankName;

    @Column(name = "account_number", nullable = false, length = 32)
    private String accountNumber;

    @Column(name = "ifsc", nullable = false, length = 16)
    private String ifsc;

    @Column(name = "last4", nullable = false, length = 4)
    private String last4;

    @Column(name = "token", nullable = false, length = 64)
    private String token;

    @Column(name = "balance", nullable = false, precision = 19, scale = 2)
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = Boolean.TRUE;

    @Column(name = "is_linked", nullable = false)
    private Boolean isLinked = Boolean.FALSE;

    @PrePersist
    private void prePersist() { // Generate token and last4 on insert
        if (this.token == null || this.token.isBlank()) {
            this.token = "bank_psp_" + UUID.randomUUID().toString().replace("-", "");
        }
        if (this.last4 == null && this.accountNumber != null && this.accountNumber.length() >= 4) {
            this.last4 = this.accountNumber.substring(this.accountNumber.length() - 4);
        }
    }
}

