package com.endava.cashflash.repository;

import com.endava.cashflash.constants.Queries;
import com.endava.cashflash.model.PaymentRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

// Provides payment-request persistence and expiry lookups.
public interface PaymentRequestRepository extends JpaRepository<PaymentRequest, Long> {

    @Query(value = Queries.FIND_PAYMENT_REQUEST_BY_ID, nativeQuery = true)
    Optional<PaymentRequest> findByPaymentRequestId(@Param("paymentRequestId") Long paymentRequestId);

    @Query(value = Queries.FIND_ACTIVE_PAYMENT_REQUESTS_EXPIRED_AT_OR_BEFORE, nativeQuery = true)
    List<PaymentRequest> findByIsActiveTrueAndExpiresAtLessThanEqual(@Param("now") Instant now);
}
