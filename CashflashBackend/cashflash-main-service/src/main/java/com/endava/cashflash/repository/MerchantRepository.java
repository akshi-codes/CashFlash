package com.endava.cashflash.repository;

import com.endava.cashflash.constants.Queries;
import com.endava.cashflash.model.Merchant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MerchantRepository extends JpaRepository<Merchant, Long> {

    @Query(value = Queries.EXISTS_BY_USER_USERID, nativeQuery = true)
    boolean existsByUser_userId(@Param("userId") Long userId); //Checks if user exits using userId
}