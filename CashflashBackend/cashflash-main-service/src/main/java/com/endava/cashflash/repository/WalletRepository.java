package com.endava.cashflash.repository;

import com.endava.cashflash.constants.Queries;
import com.endava.cashflash.model.Wallet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

// Provides wallet persistence and lookup queries.
public interface WalletRepository extends JpaRepository<Wallet, Long> {

    @Query(value = Queries.FIND_WALLET_BY_USER_ID, nativeQuery = true)
    Optional<Wallet> findByUser_UserId(@Param("userId") Long userId);

    @SuppressWarnings("unused")
    @Query(value = Queries.FIND_WALLET_BY_USER_EMAIL, nativeQuery = true)
    Optional<Wallet> findByUser_Email(@Param("email") String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select w from Wallet w where w.user.userId = :userId")
    Optional<Wallet> findByUserIdForUpdate(@Param("userId") Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select w from Wallet w where w.user.email = :email")
    Optional<Wallet> findByUserEmailForUpdate(@Param("email") String email);
}
