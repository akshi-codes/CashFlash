package com.endava.cashflash.service;

import com.endava.cashflash.dto.request.RespondToPaymentRequestRequest;
import com.endava.cashflash.dto.request.SendPaymentRequestRequest;
import com.endava.cashflash.dto.response.PaymentRequestResponse;
import com.endava.cashflash.dto.response.PaymentRequestsResponse;

import java.util.List;

// Defines the payment-request workflow operations.
public interface PaymentRequestService {

    PaymentRequestResponse sendPaymentRequest(Long requesterId, SendPaymentRequestRequest request);

    PaymentRequestResponse respondToPaymentRequest(Long recipientId, Long requestId, RespondToPaymentRequestRequest request);

    PaymentRequestResponse cancelPaymentRequest(Long requesterId, Long requestId);

    int expireDueRequests();

    List<PaymentRequestsResponse>  getAllPaymentRequests(Long userId);
}
