package com.endava.cashflash.service.impl;

import com.endava.cashflash.dto.internal.ParticipantShareDto;
import com.endava.cashflash.dto.request.RespondToPaymentRequestRequest;
import com.endava.cashflash.dto.request.SendPaymentRequestRequest;
import com.endava.cashflash.dto.response.PaymentRequestResponse;
import com.endava.cashflash.dto.response.PaymentRequestsResponse;
import com.endava.cashflash.enums.IdentifierType;
import com.endava.cashflash.enums.NotificationStatus;
import com.endava.cashflash.enums.ParticipantStatus;
import com.endava.cashflash.enums.PaymentRequestStatus;
import com.endava.cashflash.enums.UserRole;
import com.endava.cashflash.model.PaymentRequest;
import com.endava.cashflash.model.RequestParticipant;
import com.endava.cashflash.model.User;
import com.endava.cashflash.repository.PaymentRequestRepository;
import com.endava.cashflash.repository.RequestParticipantRepository;
import com.endava.cashflash.repository.UserRepository;
import com.endava.cashflash.service.NotificationService;
import com.endava.cashflash.service.PaymentRequestService;
import com.endava.cashflash.service.AuditLogService;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@Transactional
@RequiredArgsConstructor
// Orchestrates the payment-request lifecycle and participant rules.
public class PaymentRequestServiceImpl implements PaymentRequestService {

    private final PaymentRequestRepository paymentRequestRepository;
    private final RequestParticipantRepository requestParticipantRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    private static final ZoneId NOTIFICATION_ZONE = ZoneId.of("Asia/Kolkata");

    private static final DateTimeFormatter NOTIFICATION_DATE_FORMATTER =
            DateTimeFormatter.ofPattern("dd MMM yyyy 'at' hh:mm a z", Locale.ENGLISH);

    private String formatNotificationExpiry(Instant expiresAt) {
        return expiresAt.atZone(NOTIFICATION_ZONE).format(NOTIFICATION_DATE_FORMATTER);
    }

    private String buildPaymentRequestNotificationMessage(User requester,
                                                          BigDecimal shareAmount,
                                                          String message,
                                                          Instant expiresAt) {

        StringBuilder notificationMessage = new StringBuilder();
        notificationMessage.append(requester.getFullName())
                .append(" requested ₹ ")
                .append(shareAmount);

        if (message != null && !message.isBlank()) {
            notificationMessage.append(" - ").append(message.trim());
        }

        notificationMessage.append(" (Expires on ")
                .append(formatNotificationExpiry(expiresAt))
                .append(")");

        return notificationMessage.toString();
    }

    @Override
    public PaymentRequestResponse sendPaymentRequest(Long requesterId, SendPaymentRequestRequest request) {

        User requester = userRepository.findByUserId(requesterId)
                .orElseThrow(() -> new IllegalArgumentException("Requester not found"));

        validateParticipants(requesterId, requester.getRole(), request.participants());
        validateAmountSum(request.totalAmount(), request.participants());

        Instant now = Instant.now();
        Instant expiresAt = request.expiresAt() != null
                ? request.expiresAt()
                : now.plus(7, ChronoUnit.DAYS);

        PaymentRequest paymentRequest = new PaymentRequest();
        paymentRequest.setRequesterId(requesterId);
        paymentRequest.setTotalAmount(request.totalAmount());
        paymentRequest.setStatus(PaymentRequestStatus.UNPAID);
        paymentRequest.setMessage(request.message());
        paymentRequest.setCreatedAt(now);
        paymentRequest.setExpiresAt(expiresAt);
        paymentRequest.setIsActive(Boolean.TRUE);

        PaymentRequest saved = paymentRequestRepository.save(paymentRequest);

        for (var p : request.participants()) {

            User recipient = resolveRecipient(p.identifierType(), p.identifierValue());

            if (Boolean.FALSE.equals(recipient.getIsActive())) {
                throw new IllegalArgumentException("Recipient is inactive");
            }

            RequestParticipant participant = new RequestParticipant();
            participant.setRequestId(saved.getPaymentRequestId());
            participant.setRecipientId(recipient.getUserId());
            participant.setShareAmount(p.shareAmount());
            participant.setStatus(ParticipantStatus.UNPAID);

            requestParticipantRepository.save(participant);

            notificationService.notification(
                    recipient,
                    buildPaymentRequestNotificationMessage(
                            requester,
                            p.shareAmount(),
                            saved.getMessage(),
                            saved.getExpiresAt()
                    ),
                    NotificationStatus.UNREAD
            );
        }

        auditLogService.log(
                saved.getPaymentRequestId(),
                "PAYMENT_REQUEST",
                "SEND-PAYMENT-REQUEST",
                null,
                """
                {
                  "REQUESTER_ID": %s,
                  "TOTAL_AMOUNT": %s,
                  "STATUS": "%s",
                  "MESSAGE": "%s",
                  "EXPIRES_AT": "%s",
                  "IS_ACTIVE": %s,
                  "PARTICIPANT_COUNT": %s
                }
                """.formatted(
                        saved.getRequesterId(),
                        saved.getTotalAmount(),
                        saved.getStatus(),
                        saved.getMessage(),
                        saved.getExpiresAt(),
                        saved.getIsActive(),
                        request.participants().size()
                )
        );

        notificationService.notification(
                requester,
                "Payment request sent for ₹ " + saved.getTotalAmount(),
                NotificationStatus.UNREAD
        );

        return toResponse(saved);
    }

    @Override
    public PaymentRequestResponse respondToPaymentRequest(Long recipientId,
                                                          Long requestId,
                                                          RespondToPaymentRequestRequest request) {

        PaymentRequest pr = paymentRequestRepository.findByPaymentRequestId(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Payment request not found"));

        if (pr.getStatus() == PaymentRequestStatus.EXPIRED
                || pr.getStatus() == PaymentRequestStatus.CANCELLED) {
            throw new IllegalStateException("Cannot respond to expired/cancelled request");
        }

        RequestParticipant participant = requestParticipantRepository
                .findByRequestIdAndRecipientId(requestId, recipientId)
                .orElseThrow(() -> new IllegalArgumentException("Not a participant"));

        if (participant.getStatus() != ParticipantStatus.UNPAID) {
            throw new IllegalStateException("Participant status cannot be changed");
        }

        if (request.status() != ParticipantStatus.PAID
                && request.status() != ParticipantStatus.REJECTED) {
            throw new IllegalArgumentException("Invalid participant status");
        }

        ParticipantStatus oldParticipantStatus = participant.getStatus();
        PaymentRequestStatus oldRequestStatus = pr.getStatus();

        participant.setStatus(request.status());
        requestParticipantRepository.save(participant);

        recomputeRequestStatus(pr);

        User requester = userRepository.findByUserId(pr.getRequesterId())
                .orElseThrow(() -> new IllegalArgumentException("Requester not found"));

        User recipient = userRepository.findByUserId(recipientId)
                .orElseThrow(() -> new IllegalArgumentException("Recipient not found"));

        auditLogService.log(
                pr.getPaymentRequestId(),
                "PAYMENT_REQUEST",
                "RESPOND-PAYMENT-REQUEST",
                """
                {
                  "REQUEST_ID": %s,
                  "RECIPIENT_ID": %s,
                  "PARTICIPANT_STATUS": "%s",
                  "REQUEST_STATUS": "%s"
                }
                """.formatted(
                        pr.getPaymentRequestId(),
                        recipientId,
                        oldParticipantStatus,
                        oldRequestStatus
                ),
                """
                {
                  "REQUEST_ID": %s,
                  "RECIPIENT_ID": %s,
                  "PARTICIPANT_STATUS": "%s",
                  "REQUEST_STATUS": "%s",
                  "SHARE_AMOUNT": %s
                }
                """.formatted(
                        pr.getPaymentRequestId(),
                        recipientId,
                        participant.getStatus(),
                        pr.getStatus(),
                        participant.getShareAmount()
                )
        );

        notificationService.notification(
                requester,
                recipient.getFullName() + " marked request as "
                        + participant.getStatus()
                        + " for ₹ " + participant.getShareAmount(),
                NotificationStatus.UNREAD
        );

        return toResponse(pr);
    }

    @Override
    public PaymentRequestResponse cancelPaymentRequest(Long requesterId, Long requestId) {

        PaymentRequest pr = paymentRequestRepository.findByPaymentRequestId(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Payment request not found"));

        if (!pr.getRequesterId().equals(requesterId)) {
            throw new IllegalStateException("Only requester can cancel");
        }

        if (pr.getStatus() == PaymentRequestStatus.CANCELLED) {
            return toResponse(pr);
        }

        PaymentRequestStatus oldStatus = pr.getStatus();
        Boolean oldIsActive = pr.getIsActive();

        pr.setStatus(PaymentRequestStatus.CANCELLED);
        pr.setIsActive(Boolean.FALSE);
        paymentRequestRepository.save(pr);

        User requester = userRepository.findByUserId(requesterId)
                .orElseThrow(() -> new IllegalArgumentException("Requester not found"));

        List<RequestParticipant> participants =
                requestParticipantRepository.findByRequestId(pr.getPaymentRequestId());

        auditLogService.log(
                pr.getPaymentRequestId(),
                "PAYMENT_REQUEST",
                "CANCEL-PAYMENT-REQUEST",
                """
                {
                  "REQUEST_ID": %s,
                  "REQUESTER_ID": %s,
                  "STATUS": "%s",
                  "IS_ACTIVE": %s
                }
                """.formatted(
                        pr.getPaymentRequestId(),
                        requesterId,
                        oldStatus,
                        oldIsActive
                ),
                """
                {
                  "REQUEST_ID": %s,
                  "REQUESTER_ID": %s,
                  "STATUS": "%s",
                  "IS_ACTIVE": %s
                }
                """.formatted(
                        pr.getPaymentRequestId(),
                        requesterId,
                        pr.getStatus(),
                        pr.getIsActive()
                )
        );

        for (RequestParticipant rp : participants) {

            User recipient = userRepository.findByUserId(rp.getRecipientId())
                    .orElseThrow(() -> new IllegalArgumentException("Recipient not found"));

            notificationService.notification(
                    recipient,
                    "Payment request cancelled by " + requester.getFullName(),
                    NotificationStatus.UNREAD
            );
        }

        return toResponse(pr);
    }

    @Override
    public int expireDueRequests() {

        Instant now = Instant.now();
        List<PaymentRequest> due =
                paymentRequestRepository.findByIsActiveTrueAndExpiresAtLessThanEqual(now);

        int updated = 0;

        for (PaymentRequest pr : due) {

            if (pr.getStatus() == PaymentRequestStatus.UNPAID
                    || pr.getStatus() == PaymentRequestStatus.PARTIALLY_PAID) {

                PaymentRequestStatus oldStatus = pr.getStatus();
                Boolean oldIsActive = pr.getIsActive();

                pr.setStatus(PaymentRequestStatus.EXPIRED);
                pr.setIsActive(Boolean.FALSE);
                paymentRequestRepository.save(pr);

                auditLogService.log(
                        pr.getPaymentRequestId(),
                        "PAYMENT_REQUEST",
                        "EXPIRE-PAYMENT-REQUEST",
                        """
                        {
                          "REQUEST_ID": %s,
                          "REQUESTER_ID": %s,
                          "STATUS": "%s",
                          "IS_ACTIVE": %s
                        }
                        """.formatted(
                                pr.getPaymentRequestId(),
                                pr.getRequesterId(),
                                oldStatus,
                                oldIsActive
                        ),
                        """
                        {
                          "REQUEST_ID": %s,
                          "REQUESTER_ID": %s,
                          "STATUS": "%s",
                          "IS_ACTIVE": %s
                        }
                        """.formatted(
                                pr.getPaymentRequestId(),
                                pr.getRequesterId(),
                                pr.getStatus(),
                                pr.getIsActive()
                        )
                );

                User requester = userRepository.findByUserId(pr.getRequesterId())
                        .orElseThrow(() -> new IllegalArgumentException("Requester not found"));

                notificationService.notification(
                        requester,
                        "Your payment request expired",
                        NotificationStatus.UNREAD
                );

                updated++;
            }
        }

        return updated;
    }

    @Override
    public List<PaymentRequestsResponse> getAllPaymentRequests(Long userId) {
        return requestParticipantRepository.findAllPaymentRequests(userId);
    }

    private void recomputeRequestStatus(PaymentRequest pr) {

        long total = requestParticipantRepository.countByRequestId(pr.getPaymentRequestId());
        long paid = requestParticipantRepository.countByRequestIdAndStatus(
                pr.getPaymentRequestId(), ParticipantStatus.PAID);

        if (paid <= 0) {
            pr.setStatus(PaymentRequestStatus.UNPAID);
            pr.setIsActive(Boolean.TRUE);
        } else if (paid < total) {
            pr.setStatus(PaymentRequestStatus.PARTIALLY_PAID);
            pr.setIsActive(Boolean.TRUE);
        } else {
            pr.setStatus(PaymentRequestStatus.PAID);
            pr.setIsActive(Boolean.FALSE);
        }

        paymentRequestRepository.save(pr);
    }

    private void validateParticipants(Long requesterId,
                                      UserRole role,
                                      @NotEmpty @Valid List<ParticipantShareDto> participants) {

        if (participants == null || participants.isEmpty()) {
            throw new IllegalArgumentException("Participants required");
        }

        if (role == UserRole.MERCHANT && participants.size() != 1) {
            throw new IllegalArgumentException("Merchant can send to only one user");
        }

        Set<Long> unique = new HashSet<>();

        for (var p : participants) {

            User recipient = resolveRecipient(p.identifierType(), p.identifierValue());

            if (recipient.getUserId().equals(requesterId)) {
                throw new IllegalArgumentException("Requester cannot be recipient");
            }

            if (!unique.add(recipient.getUserId())) {
                throw new IllegalArgumentException("Duplicate recipient");
            }

            if (p.shareAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Share must be > 0");
            }
        }
    }

    private void validateAmountSum(BigDecimal totalAmount,
                                   @NotEmpty @Valid List<ParticipantShareDto> participants) {

        BigDecimal sum = BigDecimal.ZERO;

        for (var p : participants) {
            sum = sum.add(p.shareAmount());
        }

        if (sum.compareTo(totalAmount) != 0) {
            throw new IllegalArgumentException("Sum of shares must equal total amount");
        }
    }

    private User resolveRecipient(IdentifierType identifierType, String identifierValue) {

        if (identifierType == null || identifierValue == null || identifierValue.isBlank()) {
            throw new IllegalArgumentException("Identifier required");
        }

        String normalized = identifierValue.trim();

        if (identifierType == IdentifierType.EMAIL || identifierType == IdentifierType.PAYMENT_ID) {
            normalized = normalized.toLowerCase();
        }

        Optional<User> userOptional = switch (identifierType) {
            case EMAIL -> userRepository.findByEmail(normalized);
            case PHONE_NUMBER -> userRepository.findByPhoneNumber(normalized);
            case PAYMENT_ID -> userRepository.findByPaymentId(normalized);
        };

        return userOptional.orElseThrow(() -> new IllegalArgumentException("Recipient not found"));
    }

    private PaymentRequestResponse toResponse(PaymentRequest pr) {
        return new PaymentRequestResponse(
                pr.getPaymentRequestId(),
                pr.getRequesterId(),
                pr.getTotalAmount(),
                pr.getStatus(),
                pr.getMessage(),
                pr.getCreatedAt(),
                pr.getExpiresAt(),
                pr.getIsActive()
        );
    }
}
