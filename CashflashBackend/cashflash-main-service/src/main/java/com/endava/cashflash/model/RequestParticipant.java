package com.endava.cashflash.model;

import com.endava.cashflash.enums.ParticipantStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(
        name = "request_participants",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_request_recipient", columnNames = {"request_id", "recipient_id"})
        }
)
public class RequestParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "request_participant_id")
    private Long requestParticipantId;

    @Column(name = "request_id", nullable = false)
    private Long requestId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "request_id",
            referencedColumnName = "payment_request_id",
            insertable = false,
            updatable = false
    )
    private PaymentRequest paymentRequest;

    @Column(name = "recipient_id", nullable = false)
    private Long recipientId;

    @Column(name = "share_amount", nullable = false)
    private BigDecimal shareAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 64, nullable = false)
    private ParticipantStatus status;
}