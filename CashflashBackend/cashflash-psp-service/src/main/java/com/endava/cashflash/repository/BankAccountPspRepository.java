package com.endava.cashflash.repository;

import com.endava.cashflash.model.BankAccountPsp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Provides PSP bank-account persistence and token lookups.
public interface BankAccountPspRepository extends JpaRepository<BankAccountPsp, Long> {
    Optional<BankAccountPsp> findByIfscAndAccountNumberAndIsActiveTrue(String ifsc, String accountNumber);
    Optional<BankAccountPsp> findByTokenAndIsActiveTrue(String token);
}
