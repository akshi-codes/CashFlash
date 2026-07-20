package com.endava.cashflash.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "bank_accounts")
public class BankAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bank_account_id")
    private Long bankAccountId; // Primary key

    @Column(name = "last4", nullable = false, length = 4)
    private String last4; // Last 4 digits of the bank account

    @Column(name = "bank_name", length = 128, nullable = false)
    private String bankName; // Name of the bank

    @Column(name = "ifsc", length = 32, nullable = false)
    private String ifsc; // IFSC code of the bank account

    @Column(name = "token", nullable = false, length = 64)
    private String token; // PSP token linked to the bank account

    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = Boolean.FALSE; // Marks this as the default bank account

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = Boolean.TRUE; // Indicates whether the bank account is active

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user; // User who owns this bank account
}