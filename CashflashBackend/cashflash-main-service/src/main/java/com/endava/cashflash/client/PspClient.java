package com.endava.cashflash.client;

import com.endava.cashflash.constants.ApiPaths;
import com.endava.cashflash.constants.ErrorMessages;
import com.endava.cashflash.constants.Literals;
import com.endava.cashflash.dto.internal.*;
import com.endava.cashflash.dto.request.AddBankAccountRequest;
import com.endava.cashflash.dto.request.AddCardRequest;
import com.endava.cashflash.dto.response.AddBankAccountResponse;
import com.endava.cashflash.dto.response.AddCardResponse;
import com.endava.cashflash.exception.InvalidFieldException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class PspClient {

    private final RestClient restClient = RestClient.create();

    @Value("${psp.base-url}")
    private String pspBaseUrl;

    // Validates that the auth token is present before PSP calls
    private void validateBearerToken(String bearerToken) {
        if (bearerToken == null || bearerToken.isBlank()) {
            throw new InvalidFieldException(ErrorMessages.AUTH_TOKEN_REQUIRED);
        }
    }

    // Validates that the idempotency key is present for safe retries
    private void validateIdempotencyKey(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new InvalidFieldException(ErrorMessages.IDEMPOTENCY_KEY_REQUIRED);
        }
    }

    public AddBankAccountResponse verifyBankAccount(
            AddBankAccountRequest request,
            String bearerToken
    ) {

        validateBearerToken(bearerToken);

        // Maps the main service request to the PSP verification request
        VerifyBankAccountRequest verifyBankAccountRequest = new VerifyBankAccountRequest(
                request.accountNumber(), request.ifsc()
        );

        return restClient.post()
                .uri(pspBaseUrl + ApiPaths.PSP_BANK_ACCOUNT_VERIFY)
                .header(HttpHeaders.AUTHORIZATION, bearerToken)
                .body(verifyBankAccountRequest)
                .retrieve()
                .body(AddBankAccountResponse.class);
    }

    public BankAccountOperationResponse debitFromBankAccount(
            String token,
            BigDecimal amount,
            String idempotencyKey,
            String bearerToken
    ) {

        validateBearerToken(bearerToken);
        validateIdempotencyKey(idempotencyKey);

        BankAccountOperationRequest request = new BankAccountOperationRequest(token, amount);

        return restClient.post()
                .uri(pspBaseUrl + ApiPaths.PSP_BANK_ACCOUNT_DEBIT)
                .header(HttpHeaders.AUTHORIZATION, bearerToken)
                .header(Literals.IDEMPOTENCY_KEY, idempotencyKey)
                .body(request)
                .retrieve()
                .body(BankAccountOperationResponse.class);
    }

    public BankAccountOperationResponse creditToBankAccount(
            String token,
            BigDecimal amount,
            String idempotencyKey,
            String bearerToken
    ) {

        validateBearerToken(bearerToken);
        validateIdempotencyKey(idempotencyKey);

        BankAccountOperationRequest request = new BankAccountOperationRequest(token, amount);

        return restClient.post()
                .uri(pspBaseUrl + ApiPaths.PSP_BANK_ACCOUNT_CREDIT)
                .header(HttpHeaders.AUTHORIZATION, bearerToken)
                .header(Literals.IDEMPOTENCY_KEY, idempotencyKey)
                .body(request)
                .retrieve()
                .body(BankAccountOperationResponse.class);
    }

    public BalanceOperationResponse getBankAccountBalance(
            BalanceOperationRequest request,
            String bearerToken
    ) {

        validateBearerToken(bearerToken);

        return restClient.post()
                .uri(pspBaseUrl + ApiPaths.PSP_BANK_ACCOUNT_BALANCE)
                .header(HttpHeaders.AUTHORIZATION, bearerToken)
                .body(request)
                .retrieve()
                .body(BalanceOperationResponse.class);
    }

    public AddCardResponse verifyCard(
            AddCardRequest request,
            String bearerToken
    ) {

        validateBearerToken(bearerToken);

        // Maps the main service request to the PSP card verification request
        VerifyCardRequest verifyCardRequest = new VerifyCardRequest(
                request.cardNumber(), request.expiryMonth(), request.expiryYear(), request.cvv()
        );

        return restClient.post()
                .uri(pspBaseUrl + ApiPaths.PSP_CARD_VERIFY)
                .header(HttpHeaders.AUTHORIZATION, bearerToken)
                .body(verifyCardRequest)
                .retrieve()
                .body(AddCardResponse.class);
    }

    public CardOperationResponse debitFromCard(
            String token,
            BigDecimal amount,
            String idempotencyKey,
            String bearerToken
    ) {

        validateBearerToken(bearerToken);
        validateIdempotencyKey(idempotencyKey);

        CardOperationRequest request = new CardOperationRequest(token, amount);

        return restClient.post()
                .uri(pspBaseUrl + ApiPaths.PSP_CARD_DEBIT)
                .header(HttpHeaders.AUTHORIZATION, bearerToken)
                .header(Literals.IDEMPOTENCY_KEY, idempotencyKey)
                .body(request)
                .retrieve()
                .body(CardOperationResponse.class);
    }

    @SuppressWarnings("unused") // Can be used if necessary
    public CardOperationResponse creditToCard(
            String token,
            BigDecimal amount,
            String idempotencyKey,
            String bearerToken
    ) {

        validateBearerToken(bearerToken);
        validateIdempotencyKey(idempotencyKey);

        CardOperationRequest request = new CardOperationRequest(token, amount);

        return restClient.post()
                .uri(pspBaseUrl + ApiPaths.PSP_CARD_CREDIT)
                .header(HttpHeaders.AUTHORIZATION, bearerToken)
                .header(Literals.IDEMPOTENCY_KEY, idempotencyKey)
                .body(request)
                .retrieve()
                .body(CardOperationResponse.class);
    }
}