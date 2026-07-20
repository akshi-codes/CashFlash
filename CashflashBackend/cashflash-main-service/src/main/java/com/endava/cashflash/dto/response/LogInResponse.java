package com.endava.cashflash.dto.response;

import com.endava.cashflash.enums.UserRole;

public record LogInResponse(
        String token,
        String fullName,
        String email,
        String phoneNumber,
        UserRole role,
        String profileImageUrl,
        Boolean isKycCompleted,
        Boolean isPinSet
) {}
