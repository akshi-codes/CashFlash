package com.endava.cashflash.dto.request;

import com.endava.cashflash.enums.KycStatus;
import jakarta.validation.constraints.NotNull;

public record AdminReviewKycUpgradeRequest(
        @NotNull Long userId,
        @NotNull KycStatus kycStatus
) {}
