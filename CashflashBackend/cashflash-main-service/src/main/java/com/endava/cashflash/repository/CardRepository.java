package com.endava.cashflash.repository;

import com.endava.cashflash.constants.Queries;
import com.endava.cashflash.model.Card;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

// Provides card persistence and ownership queries.
public interface CardRepository extends JpaRepository<Card, Long> {

    @Query(value = Queries.COUNT_CARDS_BY_USER_ID, nativeQuery = true)
    long countByUser_UserId(@Param("userId") Long userId);

    @Query(value = Queries.FIND_ACTIVE_CARD_BY_CARD_ID_AND_USER_ID, nativeQuery = true)
    Optional<Card> findActiveByCardIdAndUserId(@Param("cardId") Long cardId,
                                               @Param("userId") Long userId);

    @Modifying
    @Query(value = Queries.CLEAR_DEFAULT_CARD_FOR_USER, nativeQuery = true)
    void clearDefaultCardForUser(@Param("userId") Long userId);
}
