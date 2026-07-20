package com.endava.cashflash.service.impl;

import com.endava.cashflash.constants.CacheNames;
import com.endava.cashflash.dto.internal.ActivatePaymentMethodRequest;
import com.endava.cashflash.dto.internal.DeactivatePaymentMethodRequest;
import com.endava.cashflash.dto.internal.SetDefaultMethodRequest;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

import com.endava.cashflash.service.BankAccountService;
import com.endava.cashflash.service.CardService;
import com.endava.cashflash.service.PaymentMethodService;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
// Coordinates shared payment-method actions across cards and bank accounts.
public class PaymentMethodServiceImpl implements PaymentMethodService{

    private final BankAccountService bankAccountService;
    private final CardService cardService;

    @Override
    @CacheEvict(cacheNames = CacheNames.PAYMENT_METHODS_BY_USER, key = "#userId")
    public void setDefault(Long userId, SetDefaultMethodRequest request) {

        switch (request.type()) {
            case BANK_ACCOUNT -> bankAccountService
                    .setDefaultBankAccount(request.methodId(), userId);

            case CARD -> cardService
                    .setDefaultCard(request.methodId(), userId);

            default -> throw new IllegalStateException("Unsupported instrument type");
        }

    }

    @Override
    @CacheEvict(cacheNames = CacheNames.PAYMENT_METHODS_BY_USER, key = "#userId")
    public void deactivate(Long userId, DeactivatePaymentMethodRequest request) {
        switch (request.type()) {
            case BANK_ACCOUNT ->
                    bankAccountService.deactivateBankAccount(
                            request.methodId(), userId);

            case CARD ->
                    cardService.deactivateCard(
                            request.methodId(), userId);

            default ->
                    throw new IllegalStateException("Unsupported method type");
        }
    }

    @Override
    @CacheEvict(cacheNames = CacheNames.PAYMENT_METHODS_BY_USER, key = "#userId")
    public void activate(Long userId, ActivatePaymentMethodRequest request) {
        switch (request.type()) {
            case BANK_ACCOUNT ->
                    bankAccountService.activateBankAccount(
                            request.methodId(), userId);

            case CARD ->
                    cardService.activateCard(
                            request.methodId(), userId);

            default ->
                    throw new IllegalStateException("Unsupported method type");
        }
    }
}
