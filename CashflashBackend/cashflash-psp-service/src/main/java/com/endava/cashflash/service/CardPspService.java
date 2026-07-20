package com.endava.cashflash.service;

import com.endava.cashflash.dto.request.CardOperationRequest;
import com.endava.cashflash.dto.request.VerifyCardRequest;
import com.endava.cashflash.dto.response.CardOperationResponse;
import com.endava.cashflash.dto.response.VerifyCardResponse;

// Defines PSP card verification and balance operations.
public interface CardPspService {
    VerifyCardResponse verifyCard(VerifyCardRequest request);
    CardOperationResponse debitFromCard(String idempotencyKey, CardOperationRequest request);
    CardOperationResponse creditToCard(String idempotencyKey, CardOperationRequest request);
}
