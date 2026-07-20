package com.endava.cashflash.dto.request;

import jakarta.validation.constraints.NotNull;

public record ActivateUserRequest(
        @NotNull Long userId
) {}
