package com.endava.cashflash.util;

import com.endava.cashflash.service.PaymentRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
// Periodically expires payment requests that passed their deadline.
public final class PaymentRequestSchedulerUtil {

    private final PaymentRequestService paymentRequestService;

    @SuppressWarnings("unused")
    @Scheduled(fixedDelayString = "60000")
    public void expirePaymentRequests() {
        int updated = paymentRequestService.expireDueRequests();
    }
}
