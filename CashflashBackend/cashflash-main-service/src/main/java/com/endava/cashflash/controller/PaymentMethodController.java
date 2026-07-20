package com.endava.cashflash.controller;

import com.endava.cashflash.constants.ApiPaths;
import com.endava.cashflash.dto.internal.ActivatePaymentMethodRequest;
import com.endava.cashflash.dto.internal.DeactivatePaymentMethodRequest;
import com.endava.cashflash.dto.internal.SetDefaultMethodRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.endava.cashflash.security.AuthPrincipal;
import com.endava.cashflash.service.PaymentMethodService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping(ApiPaths.PAYMENT_METHOD_BASE)
// Exposes payment-method preference and activation endpoints.
public class PaymentMethodController {

    private final PaymentMethodService paymentMethodService;

    @PutMapping(ApiPaths.PAYMENT_METHOD_SET_DEFAULT)
    public ResponseEntity<Void> setDefault(
            @RequestBody @Valid SetDefaultMethodRequest request,
            @AuthenticationPrincipal AuthPrincipal principal
    ) {
        paymentMethodService.setDefault(
                principal.getUserId(),
                request
        );

        return ResponseEntity.ok().build();
    }

    @PutMapping(ApiPaths.PAYMENT_METHOD_DEACTIVATE)
    public ResponseEntity<Void> deactivate(
            @RequestBody @Valid DeactivatePaymentMethodRequest request,
            @AuthenticationPrincipal AuthPrincipal principal
    ) {
        paymentMethodService.deactivate(
                principal.getUserId(),
                request
        );

        return ResponseEntity.ok().build();
    }

    @PutMapping(ApiPaths.PAYMENT_METHOD_ACTIVATE)
    public ResponseEntity<Void> activate(
            @RequestBody @Valid ActivatePaymentMethodRequest request,
            @AuthenticationPrincipal AuthPrincipal principal
    ) {
        paymentMethodService.activate(
                principal.getUserId(),
                request
        );

        return ResponseEntity.ok().build();
    }
}
