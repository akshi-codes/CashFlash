package com.endava.cashflash.model;

import com.endava.cashflash.enums.CardType;
import com.endava.cashflash.enums.Provider;
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
@Table(name = "cards")
public class Card {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "card_id")
    private Long cardId; // Primary key

    @Column(name = "last4", nullable = false, length = 4)
    private String last4; // Last 4 digits of the card

    @Enumerated(EnumType.STRING)
    @Column(name = "card_type", length = 64, nullable = false)
    private CardType type; // Type of card

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", length = 64, nullable = false)
    private Provider provider; // Card provider

    @Column(name = "expiry_month", length = 2)
    private String expiryMonth; // Expiry month of the card

    @Column(name = "expiry_year", length = 4)
    private String expiryYear; // Expiry year of the card

    @Column(name = "token", nullable = false, length = 64)
    private String token; // PSP token linked to the card

    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = Boolean.FALSE; // Marks this as the default card

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = Boolean.TRUE; // Indicates whether the card is active

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user; // User who owns this card
}