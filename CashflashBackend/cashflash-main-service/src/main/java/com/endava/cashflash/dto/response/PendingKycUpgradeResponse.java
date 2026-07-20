package com.endava.cashflash.dto.response;

import com.endava.cashflash.enums.KycStatus;

public record PendingKycUpgradeResponse(
        Long userId,
        String fullName,
        String email,
        KycStatus kycStatus
) {}
