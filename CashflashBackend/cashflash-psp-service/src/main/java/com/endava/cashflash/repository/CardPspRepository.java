package com.endava.cashflash.repository;

import com.endava.cashflash.model.CardPsp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Provides PSP card persistence and token lookups.
public interface CardPspRepository extends JpaRepository<CardPsp, Long> {
    Optional<CardPsp> findByCardNumberAndExpiryMonthAndExpiryYearAndIsActiveTrue(String cardNumber, String expiryMonth, String expiryYear);
    Optional<CardPsp> findByTokenAndIsActiveTrue(String token);
}
