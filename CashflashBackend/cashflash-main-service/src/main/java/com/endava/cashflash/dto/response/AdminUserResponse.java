package com.endava.cashflash.dto.response;

import com.endava.cashflash.enums.KycStatus;
import com.endava.cashflash.enums.UserRole;

import java.time.Instant;

public record AdminUserResponse(
        Long userId,
        String fullName,
        String email,
        String phoneNumber,
        String profileImageUrl,
        KycStatus kycStatus,
        String kycDocumentPath,
        String paymentId,
        UserRole role,
        Instant createdAt,
        Boolean isActive
) {}