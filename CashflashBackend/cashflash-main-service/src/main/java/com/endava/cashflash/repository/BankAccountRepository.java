package com.endava.cashflash.repository;

import com.endava.cashflash.constants.Queries;
import com.endava.cashflash.model.BankAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

// Provides bank-account persistence and ownership queries.
public interface BankAccountRepository extends JpaRepository<BankAccount, Long> {

    @Query(value = Queries.COUNT_BANK_ACCOUNTS_BY_USER_ID, nativeQuery = true)
    long countByUser_UserId(@Param("userId") Long userId);

    @Modifying
    @Query(value = Queries.CLEAR_DEFAULT_BANK_ACCOUNT_FOR_USER, nativeQuery = true)
    void clearDefaultBankAccountForUser(@Param("userId") Long userId);

    @Query(value = Queries.FIND_BANK_ACCOUNT_BY_ID_AND_USER_ID, nativeQuery = true)
    Optional<BankAccount> findByBankAccountIdAndUser_UserId(@Param("bankAccountId") Long bankAccountId,
                                                            @Param("userId") Long userId);

    @Query(value = Queries.FIND_DEFAULT_ACTIVE_BANK_ACCOUNT_BY_USER_ID, nativeQuery = true)
    Optional<BankAccount> findByUser_UserIdAndIsDefaultTrueAndIsActiveTrue(@Param("userId") Long userId);
}
