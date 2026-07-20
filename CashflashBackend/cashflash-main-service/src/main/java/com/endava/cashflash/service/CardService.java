package com.endava.cashflash.service;

import com.endava.cashflash.dto.request.AddCardRequest;
import com.endava.cashflash.dto.response.AddCardResponse;

// Defines card operations exposed by the main service.
public interface CardService {
    AddCardResponse addCard(Long userId, AddCardRequest request, String authorizationHeader);
    void setDefaultCard(Long cardId, Long userId);
    void deactivateCard(Long cardId, Long userId);
    void activateCard(Long cardId, Long userId);
}
