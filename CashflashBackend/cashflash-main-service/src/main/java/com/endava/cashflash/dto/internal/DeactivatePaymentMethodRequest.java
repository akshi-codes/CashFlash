package com.endava.cashflash.dto.internal;

import com.endava.cashflash.enums.MethodType;
import jakarta.validation.constraints.NotNull;

public record DeactivatePaymentMethodRequest(
        @NotNull MethodType type,
        @NotNull Long methodId
) { }
