package com.endava.cashflash.repository;

import com.endava.cashflash.constants.Queries;
import com.endava.cashflash.dto.response.PaymentRequestsResponse;
import com.endava.cashflash.enums.ParticipantStatus;
import com.endava.cashflash.model.RequestParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

// Provides participant persistence and payment-request participant queries.
public interface RequestParticipantRepository extends JpaRepository<RequestParticipant, Long> {

    @Query(value = Queries.FIND_REQUEST_PARTICIPANTS_BY_REQUEST_ID, nativeQuery = true)
    List<RequestParticipant> findByRequestId(@Param("requestId") Long requestId);

    @Query(value = Queries.FIND_REQUEST_PARTICIPANT_BY_REQUEST_ID_AND_RECIPIENT_ID, nativeQuery = true)
    Optional<RequestParticipant> findByRequestIdAndRecipientId(@Param("requestId") Long requestId,
                                                               @Param("recipientId") Long recipientId);

    @Query(value = Queries.COUNT_REQUEST_PARTICIPANTS_BY_REQUEST_ID, nativeQuery = true)
    long countByRequestId(@Param("requestId") Long requestId);

    @Query(value = Queries.COUNT_REQUEST_PARTICIPANTS_BY_REQUEST_ID_AND_STATUS, nativeQuery = true)
    long countByRequestIdAndStatus(@Param("requestId") Long requestId,
                                   @Param("status") String status);

    @Query("""
        select new com.endava.cashflash.dto.response.PaymentRequestsResponse(
            pr.paymentRequestId,
            case
                when pr.requesterId = :userId then recipient.fullName
                else requester.fullName
            end,
            rp.shareAmount,
            rp.status,
            pr.isActive,
            case
                when pr.requesterId = :userId then 'SENT'
                else 'RECEIVED'
            end
        )
        from RequestParticipant rp
        join PaymentRequest pr on pr.paymentRequestId = rp.requestId
        join User requester on requester.userId = pr.requesterId
        join User recipient on recipient.userId = rp.recipientId
        where rp.recipientId = :userId
           or pr.requesterId = :userId
        order by pr.createdAt desc
    """)
    List<PaymentRequestsResponse> findAllPaymentRequests(@Param("userId") Long userId);

    default long countByRequestIdAndStatus(Long requestId, ParticipantStatus status) {
        return countByRequestIdAndStatus(requestId, status.name());
    }
}
