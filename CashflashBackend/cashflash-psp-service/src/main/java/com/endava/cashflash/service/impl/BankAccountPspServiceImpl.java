package com.endava.cashflash.service.impl;

import com.endava.cashflash.dto.request.BalanceOperationRequest;
import com.endava.cashflash.dto.request.BankAccountOperationRequest;
import com.endava.cashflash.dto.request.VerifyBankAccountRequest;
import com.endava.cashflash.dto.response.BalanceOperationResponse;
import com.endava.cashflash.dto.response.BankAccountOperationResponse;
import com.endava.cashflash.dto.response.VerifyBankAccountResponse;
import com.endava.cashflash.exception.CustomException;
import com.endava.cashflash.model.BankAccountPsp;
import com.endava.cashflash.model.BankAccountPspIdempotency;
import com.endava.cashflash.repository.BankAccountPspIdempotencyRepository;
import com.endava.cashflash.repository.BankAccountPspRepository;
import com.endava.cashflash.service.BankAccountPspService;
import com.endava.cashflash.util.AccountBalanceUtil;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
// Handles PSP-side bank-account verification and balance updates.
public class BankAccountPspServiceImpl implements BankAccountPspService {

    private final BankAccountPspRepository bankAccountPspRepository;
    private final BankAccountPspIdempotencyRepository bankAccountPspIdempotencyRepository;

    @Override
    public VerifyBankAccountResponse verifyBankAccount(VerifyBankAccountRequest request) {

        BankAccountPsp bankAccountPsp = bankAccountPspRepository.findByIfscAndAccountNumberAndIsActiveTrue(request.ifsc(), request.accountNumber())
                .orElseThrow(() -> new CustomException("INVALID_BANK_ACCOUNT", "Invalid or inactive bank account"));

        if (Boolean.TRUE.equals(bankAccountPsp.getIsLinked())) {
            throw new CustomException("BANK_ACCOUNT_ALREADY_LINKED", "Is already linked");
        }


        BigDecimal balance = AccountBalanceUtil.generateRandomBalance();

        bankAccountPsp.setBalance(balance);
        bankAccountPsp.setIsLinked(true);
        bankAccountPspRepository.save(bankAccountPsp);

        return new VerifyBankAccountResponse(
                bankAccountPsp.getBankName(),
                bankAccountPsp.getIfsc(),
                bankAccountPsp.getLast4(),
                bankAccountPsp.getToken()
        );
    }

    @Override
    @Transactional
    public BankAccountOperationResponse debitFromBankAccount(String idempotencyKey, BankAccountOperationRequest request) {
        return process("DEBIT", idempotencyKey, request);
    }

    @Override
    @Transactional
    public BankAccountOperationResponse creditToBankAccount(String idempotencyKey, BankAccountOperationRequest request) {
        return process("CREDIT", idempotencyKey, request);
    }

    private BankAccountOperationResponse process(String operation, String idempotencyKey, BankAccountOperationRequest request) {

        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new CustomException("MISSING_IDEMPOTENCY_KEY", "Idempotency-Key is required");
        }

        var existing = bankAccountPspIdempotencyRepository.findByIdempotencyKeyAndOperation(idempotencyKey, operation);
        if (existing.isPresent()) {
            BankAccountPspIdempotency records = existing.get();
            return new BankAccountOperationResponse(records.getReferenceId(), records.getStatus());
        }

        String referenceId = "psp_ref_" + UUID.randomUUID().toString().replace("-", "");

        BankAccountPspIdempotency records = new BankAccountPspIdempotency();
        records.setIdempotencyKey(idempotencyKey);
        records.setOperation(operation);
        records.setToken(request.token());
        records.setAmount(request.amount());
        records.setReferenceId(referenceId);
        records.setStatus("PROCESSING");

        try {
            bankAccountPspIdempotencyRepository.save(records);
            bankAccountPspIdempotencyRepository.flush();
        } catch (DataIntegrityViolationException e) {
            BankAccountPspIdempotency already = bankAccountPspIdempotencyRepository
                    .findByIdempotencyKeyAndOperation(idempotencyKey, operation)
                    .orElseThrow();
            return new BankAccountOperationResponse(already.getReferenceId(), already.getStatus());
        }

        BankAccountPsp bankAccount = bankAccountPspRepository.findByTokenAndIsActiveTrue(request.token())
                .orElseThrow(() -> new CustomException("INVALID_BANK_TOKEN", "Invalid or inactive token"));

        if (!Boolean.TRUE.equals(bankAccount.getIsLinked())) {
            records.setStatus("FAILED");
            bankAccountPspIdempotencyRepository.save(records);
            return new BankAccountOperationResponse(referenceId, "FAILED");
        }

        BigDecimal balance = bankAccount.getBalance() != null ? bankAccount.getBalance() : BigDecimal.ZERO;
        BigDecimal amount = request.amount();

        if (amount.signum() <= 0) {
            records.setStatus("FAILED");
            bankAccountPspIdempotencyRepository.save(records);
            return new BankAccountOperationResponse(referenceId, "FAILED");
        }

        if ("DEBIT".equals(operation)) {
            if (balance.compareTo(amount) < 0) {
                records.setStatus("FAILED");
                bankAccountPspIdempotencyRepository.save(records);
                return new BankAccountOperationResponse(referenceId, "FAILED");
            }
            bankAccount.setBalance(balance.subtract(amount));
        } else {
            bankAccount.setBalance(balance.add(amount));
        }

        bankAccountPspRepository.save(bankAccount);

        records.setStatus("SUCCESSFUL");
        bankAccountPspIdempotencyRepository.save(records);

        return new BankAccountOperationResponse(referenceId, "SUCCESSFUL");
    }

    @Override
    public BalanceOperationResponse getBalance(BalanceOperationRequest request) {

        BankAccountPsp bankAccount = bankAccountPspRepository
                .findByTokenAndIsActiveTrue(request.token())
                .orElseThrow(() -> new CustomException("INVALID_BANK_TOKEN", "Invalid or inactive token"));

        if (!Boolean.TRUE.equals(bankAccount.getIsLinked())) {
            throw new CustomException("BANK_ACCOUNT_NOT_LINKED", "Bank account not linked");
        }

        BigDecimal balance = bankAccount.getBalance() != null ? bankAccount.getBalance() : BigDecimal.ZERO;

        return new BalanceOperationResponse(balance);
    }
}
