package com.endava.cashflash.controller;

import com.endava.cashflash.constants.ApiPaths;
import com.endava.cashflash.constants.Literals;
import com.endava.cashflash.dto.request.AddCardRequest;
import com.endava.cashflash.dto.response.AddCardResponse;
import com.endava.cashflash.security.AuthPrincipal;
import com.endava.cashflash.service.CardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping(ApiPaths.CARD_BASE)
// Exposes card management endpoints for authenticated users.
public class CardController {

    private final CardService cardService;

    @PostMapping(ApiPaths.CARD_ADD)
    public AddCardResponse addCard(
            @AuthenticationPrincipal AuthPrincipal principal,
            @RequestBody @Valid AddCardRequest request,
            @RequestHeader (value = Literals.AUTHORIZATION) String authorization
    ) {
        return cardService.addCard(principal.getUserId(), request, authorization);
    }
}
