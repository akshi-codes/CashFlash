package com.endava.cashflash.controller;

import com.endava.cashflash.constants.ApiPaths;
import com.endava.cashflash.dto.request.CancelPaymentRequestRequest;
import com.endava.cashflash.dto.request.RespondToPaymentRequestRequest;
import com.endava.cashflash.dto.request.SendPaymentRequestRequest;
import com.endava.cashflash.dto.response.PaymentRequestResponse;
import com.endava.cashflash.dto.response.PaymentRequestsResponse;
import com.endava.cashflash.security.AuthPrincipal;
import com.endava.cashflash.service.PaymentRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping(ApiPaths.PAYMENT_REQUEST_BASE)
// Exposes payment-request workflow endpoints.
public class PaymentRequestController {

    private final PaymentRequestService paymentRequestService;

    @PostMapping(ApiPaths.PAYMENT_REQUEST_SEND)
    public PaymentRequestResponse send(
            @AuthenticationPrincipal AuthPrincipal principal,
            @RequestBody @Valid SendPaymentRequestRequest request
    ) {
        return paymentRequestService.sendPaymentRequest(
                principal.getUserId(),
                request
        );
    }

    @PutMapping(ApiPaths.PAYMENT_REQUEST_RESPOND)
    public PaymentRequestResponse respond(
            @AuthenticationPrincipal AuthPrincipal principal,
            @RequestBody @Valid RespondToPaymentRequestRequest request
    ) {
        return paymentRequestService.respondToPaymentRequest(
                principal.getUserId(),
                request.requestId(),
                request
        );
    }

    @PutMapping(ApiPaths.PAYMENT_REQUEST_CANCEL)
    public PaymentRequestResponse cancel(
            @AuthenticationPrincipal AuthPrincipal principal,
            @RequestBody @Valid CancelPaymentRequestRequest request
    ) {
        return paymentRequestService.cancelPaymentRequest(
                principal.getUserId(),
                request.requestId()
        );
    }

    @GetMapping(ApiPaths.PAYMENT_REQUEST_ALL)
    public List<PaymentRequestsResponse> allRequests(
            @AuthenticationPrincipal AuthPrincipal principal
    ) {
        return paymentRequestService.getAllPaymentRequests(
                principal.getUserId()
        );
    }
}
