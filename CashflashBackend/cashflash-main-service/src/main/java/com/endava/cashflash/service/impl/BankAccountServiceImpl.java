package com.endava.cashflash.service.impl;

import com.endava.cashflash.client.PspClient;
import com.endava.cashflash.constants.CacheNames;
import com.endava.cashflash.constants.ErrorMessages;
import com.endava.cashflash.constants.Literals;
import com.endava.cashflash.dto.internal.BalanceOperationRequest;
import com.endava.cashflash.dto.internal.BalanceOperationResponse;
import com.endava.cashflash.dto.request.AddBankAccountRequest;
import com.endava.cashflash.dto.request.BankAccountBalanceRequest;
import com.endava.cashflash.dto.response.AddBankAccountResponse;
import com.endava.cashflash.dto.response.BankAccountBalanceResponse;
import com.endava.cashflash.enums.NotificationStatus;
import com.endava.cashflash.exception.InvalidFieldException;
import com.endava.cashflash.exception.OwnershipViolationException;
import com.endava.cashflash.exception.ResourceNotFoundException;
import com.endava.cashflash.model.BankAccount;
import com.endava.cashflash.model.User;
import com.endava.cashflash.repository.BankAccountRepository;
import com.endava.cashflash.repository.UserRepository;
import com.endava.cashflash.service.AuditLogService;
import com.endava.cashflash.service.BankAccountService;
import com.endava.cashflash.service.NotificationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BankAccountServiceImpl implements BankAccountService {

    private final UserRepository userRepository;
    private final BankAccountRepository bankAccountRepository;
    private final PspClient pspClient;
    private final AuditLogService auditLogService; // Audit log service for tracking bank account actions
    private final NotificationService notificationService;

    /**
     * Adds a bank account for the given user by verifying it via PSP and saving it locally.
     * @param userId user identifier
     * @param request bank account details to verify and link
     * @param authorizationHeader auth header forwarded to PSP service
     * @return PSP response containing verified bank details and token
     * @throws ResourceNotFoundException when user is not found
     */
    @Override
    @Transactional
    @CacheEvict(cacheNames = CacheNames.PAYMENT_METHODS_BY_USER, key = "#userId")
    public AddBankAccountResponse addBankAccount(
            Long userId,
            AddBankAccountRequest request,
            String authorizationHeader
    ) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(Literals.USER_RESOURCE, userId)); // Validates user exists

        AddBankAccountResponse pspResponse = pspClient.verifyBankAccount(request, authorizationHeader); // Verifies bank account with PSP

        boolean firstAccount = bankAccountRepository.countByUser_UserId(userId) == 0; // Checks if this is the user's first bank account
        boolean makeDefault = Boolean.TRUE.equals(request.isDefault()) || firstAccount; // Makes the account default when requested or first

        if (makeDefault) {
            bankAccountRepository.clearDefaultBankAccountForUser(userId); // Clears previous default before assigning the new one
        }

        BankAccount bankAccount = new BankAccount();
        bankAccount.setUser(user);
        bankAccount.setBankName(pspResponse.bankName());
        bankAccount.setIfsc(pspResponse.ifsc());
        bankAccount.setLast4(pspResponse.last4());
        bankAccount.setToken(pspResponse.token());
        bankAccount.setIsDefault(makeDefault);

        bankAccountRepository.save(bankAccount); // Saves the verified bank account locally

        auditLogService.log(
                userId,
                Literals.BANK_ACCOUNT,
                Literals.ADD_BANK_ACCOUNT,
                null,
                """
                {
                  "BANK_NAME": "%s",
                  "IFSC": "%s",
                  "LAST4": "%s",
                  "IS_DEFAULT": "%s",
                  "STATUS": "%s"
                }
                """.formatted(
                        pspResponse.bankName(),
                        pspResponse.ifsc(),
                        pspResponse.last4(),
                        makeDefault,
                        Literals.SUCCESSFUL
                )
        ); // Audit log for bank account linking

        notificationService.notification(
                user,
                Literals.BANK_ACCOUNT_ADDED_MESSAGE.formatted(pspResponse.last4()),
                NotificationStatus.UNREAD
        );

        return pspResponse; // Returns PSP-verified bank account details
    }

    /**
     * Sets the selected bank account as default for the given user.
     * @param bankaccountId bank account identifier
     * @param userId user identifier
     * @throws ResourceNotFoundException when bank account is not found
     * @throws OwnershipViolationException when bank account does not belong to user
     * @throws InvalidFieldException when bank account is inactive
     */
    @Override
    @CacheEvict(cacheNames = CacheNames.PAYMENT_METHODS_BY_USER, key = "#userId")
    public void setDefaultBankAccount(
            Long bankaccountId,
            Long userId
    ) {

        BankAccount bankAccount = bankAccountRepository
                .findById(bankaccountId)
                .orElseThrow(() -> new ResourceNotFoundException(Literals.BANK_ACCOUNT_RESOURCE, bankaccountId));

        if (!bankAccount.getUser().getUserId().equals(userId)) {
            throw new OwnershipViolationException(Literals.BANK_ACCOUNT_OWNERSHIP_MESSAGE);
        }

        if (!Boolean.TRUE.equals(bankAccount.getIsActive())) {
            throw new InvalidFieldException(Literals.INACTIVE_BANK_ACCOUNT_DEFAULT_MESSAGE);
        }

        bankAccountRepository.clearDefaultBankAccountForUser(userId); // Clears old default bank account for the user

        bankAccount.setIsDefault(true);
        bankAccountRepository.save(bankAccount);

        auditLogService.log(
                bankAccount.getUser().getUserId(),
                Literals.BANK_ACCOUNT,
                Literals.CHANGE_DEFAULT_BANK_ACCOUNT,
                """
                {
                  "bankName": "%s",
                  "ifsc": "%s",
                  "accountNumber": "%s",
                  "token": "%s",
                  "isDefault": %s
                }
                """.formatted(
                        bankAccount.getBankName(),
                        bankAccount.getIfsc(),
                        bankAccount.getLast4(),
                        bankAccount.getToken(),
                        bankAccount.getIsDefault()
                ),
                """
                {
                  "bankName": "%s",
                  "ifsc": "%s",
                  "accountNumber": "%s",
                  "token": "%s",
                  "isDefault": %s
                }
                """.formatted(
                        bankAccount.getBankName(),
                        bankAccount.getIfsc(),
                        bankAccount.getLast4(),
                        bankAccount.getToken(),
                        bankAccount.getIsDefault()
                )
        ); // Audit log for default bank account change

        notificationService.notification(
                bankAccount.getUser(),
                Literals.BANK_ACCOUNT_DEFAULT_MESSAGE.formatted(bankAccount.getLast4()),
                NotificationStatus.UNREAD
        );
    }

    /**
     * Deactivates the selected bank account for the given user.
     * @param bankAccountId bank account identifier
     * @param userId user identifier
     * @throws ResourceNotFoundException when bank account is not found
     * @throws OwnershipViolationException when bank account does not belong to user
     */
    @Override
    @CacheEvict(cacheNames = CacheNames.PAYMENT_METHODS_BY_USER, key = "#userId")
    public void deactivateBankAccount(
            Long bankAccountId,
            Long userId
    ) {

        BankAccount bankAccount = bankAccountRepository
                .findById(bankAccountId)
                .orElseThrow(() -> new ResourceNotFoundException(Literals.BANK_ACCOUNT_RESOURCE, bankAccountId));

        if (!bankAccount.getUser().getUserId().equals(userId)) {
            throw new OwnershipViolationException(Literals.BANK_ACCOUNT_OWNERSHIP_MESSAGE);
        }

        Boolean oldIsDefault = bankAccount.getIsDefault();
        Boolean oldIsActive = bankAccount.getIsActive(); // Captures old state for audit logging

        if (Boolean.TRUE.equals(bankAccount.getIsDefault())) {
            bankAccount.setIsDefault(false); // Removes default flag when deactivating the default bank account
        }

        bankAccount.setIsActive(false);
        bankAccountRepository.save(bankAccount);

        auditLogService.log(
                userId,
                Literals.BANK_ACCOUNT,
                Literals.DEACTIVATE_BANK_ACCOUNT,
                """
                {
                  "BANK_NAME": "%s",
                  "IFSC": "%s",
                  "LAST4": "%s",
                  "TOKEN": "%s",
                  "IS_DEFAULT": %s,
                  "IS_ACTIVE": %s
                }
                """.formatted(
                        bankAccount.getBankName(),
                        bankAccount.getIfsc(),
                        bankAccount.getLast4(),
                        bankAccount.getToken(),
                        oldIsDefault,
                        oldIsActive
                ),
                """
                {
                  "BANK_NAME": "%s",
                  "IFSC": "%s",
                  "LAST4": "%s",
                  "TOKEN": "%s",
                  "IS_DEFAULT": %s,
                  "IS_ACTIVE": %s
                }
                """.formatted(
                        bankAccount.getBankName(),
                        bankAccount.getIfsc(),
                        bankAccount.getLast4(),
                        bankAccount.getToken(),
                        bankAccount.getIsDefault(),
                        bankAccount.getIsActive()
                )
        ); // Audit log for bank account deactivation

        notificationService.notification(
                bankAccount.getUser(),
                Literals.BANK_ACCOUNT_DEACTIVATED_MESSAGE.formatted(bankAccount.getLast4()),
                NotificationStatus.UNREAD
        );
    }

    /**
     * Activates the selected bank account for the given user.
     * @param bankAccountId bank account identifier
     * @param userId user identifier
     * @throws ResourceNotFoundException when bank account is not found
     * @throws OwnershipViolationException when bank account does not belong to user
     */
    @Override
    @CacheEvict(cacheNames = CacheNames.PAYMENT_METHODS_BY_USER, key = "#userId")
    public void activateBankAccount(
            Long bankAccountId,
            Long userId
    ) {

        BankAccount bankAccount = bankAccountRepository.findById(bankAccountId)
                .orElseThrow(() -> new ResourceNotFoundException(Literals.BANK_ACCOUNT_RESOURCE, bankAccountId));

        if (!bankAccount.getUser().getUserId().equals(userId)) {
            throw new OwnershipViolationException(Literals.BANK_ACCOUNT_OWNERSHIP_MESSAGE);
        }

        if (Boolean.TRUE.equals(bankAccount.getIsActive())) {
            return; // Skips update when the bank account is already active
        }

        Boolean oldIsDefault = bankAccount.getIsDefault();
        Boolean oldIsActive = bankAccount.getIsActive(); // Captures old state for audit logging

        bankAccount.setIsActive(true);
        bankAccountRepository.save(bankAccount);

        auditLogService.log(
                userId,
                Literals.BANK_ACCOUNT,
                Literals.ACTIVATE_BANK_ACCOUNT,
                """
                {
                  "BANK_NAME": "%s",
                  "IFSC": "%s",
                  "LAST4": "%s",
                  "TOKEN": "%s",
                  "IS_DEFAULT": %s,
                  "IS_ACTIVE": %s
                }
                """.formatted(
                        bankAccount.getBankName(),
                        bankAccount.getIfsc(),
                        bankAccount.getLast4(),
                        bankAccount.getToken(),
                        oldIsDefault,
                        oldIsActive
                ),
                """
                {
                  "BANK_NAME": "%s",
                  "IFSC": "%s",
                  "LAST4": "%s",
                  "TOKEN": "%s",
                  "IS_DEFAULT": %s,
                  "IS_ACTIVE": %s
                }
                """.formatted(
                        bankAccount.getBankName(),
                        bankAccount.getIfsc(),
                        bankAccount.getLast4(),
                        bankAccount.getToken(),
                        bankAccount.getIsDefault(),
                        bankAccount.getIsActive()
                )
        ); // Audit log for bank account activation

        notificationService.notification(
                bankAccount.getUser(),
                Literals.BANK_ACCOUNT_ACTIVATED_MESSAGE.formatted(bankAccount.getLast4()),
                NotificationStatus.UNREAD
        );
    }

    /**
     * Fetches the current balance of the selected bank account through PSP.
     * @param userId user identifier
     * @param request request containing bank account id
     * @param bearerToken auth token forwarded to PSP service
     * @return bank account balance response
     * @throws InvalidFieldException when bearer token is missing
     * @throws ResourceNotFoundException when bank account is not found for the user
     */
    @Override
    public BankAccountBalanceResponse bankAccountBalance(
            Long userId,
            BankAccountBalanceRequest request,
            String bearerToken
    ) {
        if (bearerToken == null || bearerToken.isBlank()) {
            throw new InvalidFieldException(ErrorMessages.AUTH_TOKEN_REQUIRED);
        }

        Long bankAccountId = request.bankAccountId();

        BankAccount bankAccount = bankAccountRepository
                .findByBankAccountIdAndUser_UserId(bankAccountId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(Literals.BANK_ACCOUNT_RESOURCE_COMPACT, bankAccountId));

        BalanceOperationResponse pspRes = pspClient.getBankAccountBalance(
                new BalanceOperationRequest(bankAccount.getToken()), // Keeps PSP token server-side
                bearerToken
        );

        return new BankAccountBalanceResponse(
                bankAccountId,
                pspRes.balance()
        );
    }
}