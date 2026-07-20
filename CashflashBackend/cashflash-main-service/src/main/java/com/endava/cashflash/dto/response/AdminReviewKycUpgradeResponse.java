package com.endava.cashflash.dto.response;

import com.endava.cashflash.enums.KycStatus;

public record AdminReviewKycUpgradeResponse(
        Long userId,
        KycStatus kycStatus
) {}
