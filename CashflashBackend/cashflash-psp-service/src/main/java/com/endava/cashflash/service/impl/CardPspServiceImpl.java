package com.endava.cashflash.service.impl;

import com.endava.cashflash.dto.request.CardOperationRequest;
import com.endava.cashflash.dto.request.VerifyCardRequest;
import com.endava.cashflash.dto.response.CardOperationResponse;
import com.endava.cashflash.dto.response.VerifyCardResponse;
import com.endava.cashflash.exception.CustomException;
import com.endava.cashflash.model.CardPsp;
import com.endava.cashflash.model.CardPspIdempotency;
import com.endava.cashflash.repository.CardPspIdempotencyRepository;
import com.endava.cashflash.repository.CardPspRepository;
import com.endava.cashflash.service.CardPspService;
import com.endava.cashflash.util.AccountBalanceUtil;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
// Handles PSP-side card verification and balance updates.
public class CardPspServiceImpl implements CardPspService {

    private final CardPspRepository cardPspRepository;
    private final CardPspIdempotencyRepository cardPspIdempotencyRepository;

    @Override
    @Transactional
    public VerifyCardResponse verifyCard(VerifyCardRequest request) {

        CardPsp cardPsp = cardPspRepository
                .findByCardNumberAndExpiryMonthAndExpiryYearAndIsActiveTrue(
                        request.cardNumber(), request.expiryMonth(), request.expiryYear()
                )
                .orElseGet(() -> {
                    CardPsp card = new CardPsp();
                    card.setCardNumber(request.cardNumber());
                    card.setExpiryMonth(request.expiryMonth());
                    card.setExpiryYear(request.expiryYear());

                    card.setIsActive(true);
                    card.setIsLinked(false);

                    String digits = request.cardNumber() != null ? request.cardNumber().replaceAll("\\D", "") : "";
                    String last4 = digits.length() >= 4 ? digits.substring(digits.length() - 4) : digits;
                    card.setLast4(last4);

                    card.setToken("psp_card_token_" + UUID.randomUUID().toString().replace("-", ""));

                    return card;
                });

        if (Boolean.TRUE.equals(cardPsp.getIsLinked())) {
            throw new CustomException("CARD_ALREADY_LINKED", "Card is already linked");
        }

        BigDecimal balance = AccountBalanceUtil.generateRandomBalance();

        cardPsp.setProvider(detectProvider(request.cardNumber()));
        cardPsp.setType(detectType(request.cardNumber()));

        cardPsp.setBalance(balance);
        cardPsp.setIsLinked(true);
        cardPspRepository.save(cardPsp);

        return new VerifyCardResponse(
                cardPsp.getProvider(),
                cardPsp.getType(),
                cardPsp.getLast4(),
                cardPsp.getExpiryMonth(),
                cardPsp.getExpiryYear(),
                cardPsp.getToken()
        );
    }

    @Override
    @Transactional
    public CardOperationResponse debitFromCard(String idempotencyKey, CardOperationRequest request) {
        return process("DEBIT", idempotencyKey, request);
    }

    @Override
    @Transactional
    public CardOperationResponse creditToCard(String idempotencyKey, CardOperationRequest request) {
        return process("CREDIT", idempotencyKey, request);
    }

    private CardOperationResponse process(String operation, String idempotencyKey, CardOperationRequest request) {

        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new CustomException("MISSING_IDEMPOTENCY_KEY", "Idempotency-Key is required");
        }

        var existing = cardPspIdempotencyRepository.findByIdempotencyKeyAndOperation(idempotencyKey, operation);
        if (existing.isPresent()) {
            CardPspIdempotency record = existing.get();
            return new CardOperationResponse(record.getReferenceId(), record.getStatus());
        }

        String referenceId = "psp_card_ref_" + UUID.randomUUID().toString().replace("-", "");

        CardPspIdempotency record = new CardPspIdempotency();
        record.setIdempotencyKey(idempotencyKey);
        record.setOperation(operation);
        record.setToken(request.token());
        record.setAmount(request.amount());
        record.setReferenceId(referenceId);
        record.setStatus("PROCESSING");

        try {
            cardPspIdempotencyRepository.save(record);
            cardPspIdempotencyRepository.flush();
        } catch (DataIntegrityViolationException e) {
            CardPspIdempotency already = cardPspIdempotencyRepository
                    .findByIdempotencyKeyAndOperation(idempotencyKey, operation)
                    .orElseThrow();
            return new CardOperationResponse(already.getReferenceId(), already.getStatus());
        }

        CardPsp card = cardPspRepository.findByTokenAndIsActiveTrue(request.token())
                .orElseThrow(() -> new CustomException("INVALID_CARD_TOKEN", "Invalid or inactive token"));

        if (!Boolean.TRUE.equals(card.getIsLinked())) {
            record.setStatus("FAILED");
            cardPspIdempotencyRepository.save(record);
            return new CardOperationResponse(referenceId, "FAILED");
        }

        BigDecimal amount = request.amount();
        if (amount == null || amount.signum() <= 0) {
            record.setStatus("FAILED");
            cardPspIdempotencyRepository.save(record);
            return new CardOperationResponse(referenceId, "FAILED");
        }

        BigDecimal balance = card.getBalance() != null ? card.getBalance() : BigDecimal.ZERO;

        if ("DEBIT".equals(operation)) {
            if (balance.compareTo(amount) < 0) {
                record.setStatus("FAILED");
                cardPspIdempotencyRepository.save(record);
                return new CardOperationResponse(referenceId, "FAILED");
            }
            card.setBalance(balance.subtract(amount));
        } else {
            card.setBalance(balance.add(amount));
        }

        cardPspRepository.save(card);

        record.setStatus("SUCCESSFUL");
        cardPspIdempotencyRepository.save(record);

        return new CardOperationResponse(referenceId, "SUCCESSFUL");
    }

    private String detectProvider(String cardNumber) {
        if (cardNumber == null) return "VISA";
        String number = cardNumber.replaceAll("\\D", "");

        if (number.startsWith("4")) return "VISA";
        if (number.matches("^(5[1-5].*|22[2-9].*|2[3-6].*|27[01].*|2720.*)$")) return "MASTERCARD";
        if (number.startsWith("34") || number.startsWith("37")) return "AMERICAN_EXPRESS";
        if (number.startsWith("60") || number.startsWith("65") || number.startsWith("81") || number.startsWith("82")
                || number.startsWith("508") || number.startsWith("353") || number.startsWith("356")) return "RUPAY";

        return "VISA";
    }

    @SuppressWarnings("unused")
    private String detectType(String cardNumber) {
        return "DEBIT";
    }
}
