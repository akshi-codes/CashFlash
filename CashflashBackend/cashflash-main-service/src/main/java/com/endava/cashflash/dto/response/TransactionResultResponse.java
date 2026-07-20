package com.endava.cashflash.dto.response;

public record TransactionResultResponse(
        Long transactionId,
        String status,
        String referenceId
) {}
