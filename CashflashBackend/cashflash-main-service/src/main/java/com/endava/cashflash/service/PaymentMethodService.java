package com.endava.cashflash.service;

import com.endava.cashflash.dto.internal.ActivatePaymentMethodRequest;
import com.endava.cashflash.dto.internal.DeactivatePaymentMethodRequest;
import com.endava.cashflash.dto.internal.SetDefaultMethodRequest;

// Defines shared payment-method activation and preference operations.
public interface PaymentMethodService {

    void setDefault(
            Long userId,
            SetDefaultMethodRequest request
    );

    void deactivate(
            Long userId,
            DeactivatePaymentMethodRequest request
    );

    void activate(
            Long userId,
            ActivatePaymentMethodRequest request
    );
}
