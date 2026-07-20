package com.endava.cashflash.dto.response;

public record ActivateUserResponse(
        Long userId,
        Boolean isActivated
) {}