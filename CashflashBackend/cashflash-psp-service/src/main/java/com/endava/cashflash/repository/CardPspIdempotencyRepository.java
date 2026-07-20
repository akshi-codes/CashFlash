package com.endava.cashflash.repository;

import com.endava.cashflash.model.CardPspIdempotency;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Provides idempotency record access for PSP card operations.
public interface CardPspIdempotencyRepository extends JpaRepository<CardPspIdempotency, Long> {
    Optional<CardPspIdempotency> findByIdempotencyKeyAndOperation(String idempotencyKey, String operation);
}
