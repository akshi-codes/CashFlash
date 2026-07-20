package com.endava.cashflash.controller;

import com.endava.cashflash.constants.ApiPaths;
import com.endava.cashflash.dto.request.CardOperationRequest;
import com.endava.cashflash.dto.request.VerifyCardRequest;
import com.endava.cashflash.dto.response.CardOperationResponse;
import com.endava.cashflash.dto.response.VerifyCardResponse;
import com.endava.cashflash.service.CardPspService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping(ApiPaths.CARD_PSP_BASE)
// Exposes PSP card verification and balance operations.
public class CardPspController {

    private final CardPspService cardPspService;

    @PostMapping(ApiPaths.CARD_PSP_VERIFY)
    public VerifyCardResponse verify(@RequestBody @Valid VerifyCardRequest request) {
        return cardPspService.verifyCard(request);
    }

    @PostMapping(ApiPaths.CARD_PSP_DEBIT)
    public CardOperationResponse debit(
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @RequestBody @Valid CardOperationRequest request
    ) {
        return cardPspService.debitFromCard(idempotencyKey, request);
    }

    @PostMapping(ApiPaths.CARD_PSP_CREDIT)
    public CardOperationResponse credit(
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @RequestBody @Valid CardOperationRequest request
    ) {
        return cardPspService.creditToCard(idempotencyKey, request);
    }
}
