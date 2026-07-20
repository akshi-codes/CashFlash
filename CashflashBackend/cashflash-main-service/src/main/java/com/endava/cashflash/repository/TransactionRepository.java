package com.endava.cashflash.repository;

import com.endava.cashflash.constants.Queries;
import com.endava.cashflash.dto.response.TransactionOverviewResponse;
import com.endava.cashflash.model.Transaction;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

// Provides transaction persistence and overview aggregates.
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    @Query(value = Queries.FIND_TRANSACTION_BY_IDEMPOTENCY_KEY, nativeQuery = true)
    Optional<Transaction> findByIdempotencyKey(@Param("idempotencyKey") String idempotencyKey);

    @Query(value = Queries.FIND_TRANSACTIONS_BY_SENDER_ID_OR_RECEIVER_ID_ORDER_BY_CREATED_AT_DESC, nativeQuery = true)
    List<Transaction> findBySenderIdOrReceiverIdOrderByCreatedAtDesc(@Param("senderId") Long senderId,
                                                                     @Param("receiverId") Long receiverId);

    @Query(value = Queries.FIND_LATEST_TRANSACTIONS_FOR_USER, nativeQuery = true)
    List<Transaction> findLatestForUser(@Param("userId") Long userId,
                                        Pageable pageable);

    @Query("""
                select new com.endava.cashflash.dto.response.TransactionOverviewResponse(
                    count(t),
                    sum(case when t.status = com.endava.cashflash.enums.TransactionStatus.SUCCESSFUL then 1 else 0 end),
                    sum(case when t.status = com.endava.cashflash.enums.TransactionStatus.PENDING then 1 else 0 end),
                    sum(case when t.status = com.endava.cashflash.enums.TransactionStatus.FAILED then 1 else 0 end),
                    sum(t.amount)
                )
                from Transaction t
            """)
    TransactionOverviewResponse overview();

}
