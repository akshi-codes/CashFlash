package com.endava.cashflash.repository;

import com.endava.cashflash.constants.Queries;
import com.endava.cashflash.model.AuthUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

// Persists authentication-specific user records.
public interface AuthUserRepository extends JpaRepository<AuthUser, Long> {

    @Query(value = Queries.FIND_BY_USER_EMAIL, nativeQuery = true)
    Optional<AuthUser> findByUserEmail(@Param("email") String email); //Finds user using email

    @Query(value = Queries.FIND_BY_USER_USERID, nativeQuery = true)
    Optional<AuthUser> findByUser_UserId(@Param("userId") Long userid);
}
