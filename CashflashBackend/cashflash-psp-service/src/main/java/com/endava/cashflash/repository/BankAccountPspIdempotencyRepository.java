package com.endava.cashflash.repository;

import com.endava.cashflash.model.BankAccountPspIdempotency;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Provides idempotency record access for PSP bank-account operations.
public interface BankAccountPspIdempotencyRepository extends JpaRepository<BankAccountPspIdempotency, Long> {
    Optional<BankAccountPspIdempotency> findByIdempotencyKeyAndOperation(String idempotencyKey, String operation);
}
