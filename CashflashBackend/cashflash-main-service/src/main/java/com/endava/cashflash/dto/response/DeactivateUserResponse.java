package com.endava.cashflash.dto.response;

public record DeactivateUserResponse(
        Long userId,
        Boolean isDeactivated
) {}
