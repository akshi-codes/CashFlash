package com.endava.cashflash.service.impl;

import com.endava.cashflash.client.PspClient;
import com.endava.cashflash.constants.ErrorMessages;
import com.endava.cashflash.constants.Literals;
import com.endava.cashflash.constants.NumericalConstants;
import com.endava.cashflash.constants.SecurityConstants;
import com.endava.cashflash.dto.internal.BankAccountOperationResponse;
import com.endava.cashflash.dto.internal.CardOperationResponse;
import com.endava.cashflash.dto.internal.LastTransactionDto;
import com.endava.cashflash.dto.internal.UserTransactionResponseDto;
import com.endava.cashflash.dto.request.SendMoneyRequest;
import com.endava.cashflash.dto.request.WalletTopUpRequest;
import com.endava.cashflash.dto.request.WalletWithdrawRequest;
import com.endava.cashflash.dto.response.AllTransactionResponseDto;
import com.endava.cashflash.dto.response.TransactionResultResponse;
import com.endava.cashflash.enums.DestinationType;
import com.endava.cashflash.enums.NotificationStatus;
import com.endava.cashflash.enums.SourceType;
import com.endava.cashflash.enums.CardType;
import com.endava.cashflash.enums.TransactionDirection;
import com.endava.cashflash.enums.TransactionStatus;
import com.endava.cashflash.enums.TransactionType;
import com.endava.cashflash.enums.UserRole;
import com.endava.cashflash.exception.InsufficientBalanceException;
import com.endava.cashflash.exception.InvalidTransactionDirectionException;
import com.endava.cashflash.exception.InvalidFieldException;
import com.endava.cashflash.exception.OwnershipViolationException;
import com.endava.cashflash.exception.ResourceNotFoundException;
import com.endava.cashflash.model.BankAccount;
import com.endava.cashflash.model.Card;
import com.endava.cashflash.model.Transaction;
import com.endava.cashflash.model.User;
import com.endava.cashflash.model.Wallet;
import com.endava.cashflash.repository.BankAccountRepository;
import com.endava.cashflash.repository.CardRepository;
import com.endava.cashflash.repository.TransactionRepository;
import com.endava.cashflash.repository.UserRepository;
import com.endava.cashflash.repository.WalletRepository;
import com.endava.cashflash.service.AuditLogService;
import com.endava.cashflash.service.NotificationService;
import com.endava.cashflash.service.TransactionService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
// Orchestrates wallet, bank, and request-based money movements.
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final BankAccountRepository bankAccountRepository;
    private final CardRepository cardRepository;
    private final WalletRepository walletRepository;
    private final PspClient pspClient;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    // Read APIs

    @Override
    public List<UserTransactionResponseDto> getUserTransactions(Long userId) {

        List<Transaction> transactions =
                transactionRepository.findBySenderIdOrReceiverIdOrderByCreatedAtDesc(userId, userId);

        Map<Long, String> userNames =
                userRepository.findAllById(
                        transactions.stream()
                                .flatMap(transaction -> Stream.of(transaction.getSenderId(), transaction.getReceiverId()))
                                .filter(Objects::nonNull)
                                .collect(Collectors.toSet())
                ).stream().collect(Collectors.toMap(
                        User::getUserId,
                        User::getFullName
                ));

        return transactions.stream().map(transaction -> {

            boolean isSender = transaction.getSenderId().equals(userId);
            boolean isReceiver = transaction.getReceiverId().equals(userId);

            String name;
            TransactionDirection direction;

            if (isSender && isReceiver) {
                direction = TransactionDirection.SELF;
                name = "Myself";
            } else if (isSender) {
                direction = TransactionDirection.SENT;
                name = userNames.get(transaction.getReceiverId());
            } else {
                direction = TransactionDirection.RECEIVED;
                name = userNames.get(transaction.getSenderId());
            }

            return new UserTransactionResponseDto(
                    transaction.getTransactionId(),
                    name,
                    transaction.getTransactionType().name(),
                    transaction.getAmount(),
                    transaction.getStatus().name(),
                    direction,
                    transaction.getReferenceId(),
                    transaction.getCreatedAt()
            );
        }).toList();
    }

    @Override
    public List<AllTransactionResponseDto> getAllTransactions() {

        List<Transaction> transactions =
                transactionRepository.findAll();

        Map<Long, String> userNames =
                userRepository.findAllById(
                        transactions.stream()
                                .flatMap(transaction -> Stream.of(transaction.getSenderId(), transaction.getReceiverId()))
                                .filter(Objects::nonNull)
                                .collect(Collectors.toSet())
                ).stream().collect(Collectors.toMap(
                        User::getUserId,
                        User::getFullName
                ));

        return transactions.stream()
                .sorted(Comparator.comparing(Transaction::getCreatedAt).reversed())
                .map(transaction -> new AllTransactionResponseDto(
                        transaction.getTransactionId(),
                        userNames.getOrDefault(transaction.getSenderId(), "System"),
                        userNames.getOrDefault(transaction.getReceiverId(), "System"),
                        transaction.getTransactionType().name(),
                        transaction.getAmount(),
                        transaction.getStatus().name(),
                        transaction.getReferenceId(),
                        transaction.getCreatedAt()
                ))
                .toList();
    }


    @Override
    public LastTransactionDto getLastTransaction(Long userId) {

        List<Transaction> transactions =
                transactionRepository.findLatestForUser(userId, PageRequest.of(0, 1));

        if (transactions.isEmpty()) return null;

        Transaction transaction = transactions.getFirst();

        String direction;

        if (transaction.getSenderId().equals(userId) && transaction.getReceiverId().equals(userId)) {
            direction = "SELF-TRANSFER";
        } else if (transaction.getSenderId().equals(userId)) {
            direction = "SENT";
        } else {
            direction = "RECEIVED";
        }

        return new LastTransactionDto(
                direction,
                transaction.getAmount(),
                transaction.getFinalAmount(),
                transaction.getStatus(),
                transaction.getCreatedAt()
        );
    }

    // Common helpers

    private TransactionResultResponse buildResponse(Transaction transaction) {
        return new TransactionResultResponse(
                transaction.getTransactionId(),
                transaction.getStatus().name(),
                transaction.getReferenceId()
        );
    }

    private Optional<Transaction> checkIdempotency(String key) {
        return transactionRepository.findByIdempotencyKey(key);
    }

    private boolean isSuccessful(String status) {
        return "SUCCESSFUL".equalsIgnoreCase(status);
    }

    private boolean isMerchant(long userId) {
        return userRepository.findById(userId)
                .map(user -> user.getRole() == UserRole.MERCHANT)
                .orElse(false);
    }

    private Wallet getWalletForUpdate(Long userId) {
        return walletRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", userId));
    }

    private void addFeeToAdminWallet(BigDecimal feeAmount) {
        if (feeAmount == null || feeAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        Wallet adminWallet = walletRepository.findByUserEmailForUpdate(SecurityConstants.ADMIN_EMAIL)
                .orElseThrow(() -> new ResourceNotFoundException("Admin Wallet", 0L));

        BigDecimal currentBalance = adminWallet.getBalance() == null
                ? BigDecimal.ZERO
                : adminWallet.getBalance();

        adminWallet.setBalance(currentBalance.add(feeAmount));
    }

    private Transaction createTransaction(
            Long senderId,
            Long receiverId,
            SourceType sourceType,
            DestinationType destinationType,
            TransactionType type,
            BigDecimal amount,
            String description,
            String idempotencyKey
    ) {
        BigDecimal feeAmount = BigDecimal.ZERO;
        BigDecimal taxAmount = BigDecimal.ZERO;
        BigDecimal finalAmount = amount;

        boolean applyCharges = (senderId != null && receiverId != null && !senderId.equals(receiverId))
                && isMerchant(receiverId);

        if (applyCharges) {
            feeAmount = amount
                    .multiply(new BigDecimal(NumericalConstants.FEE_RATE))
                    .setScale(2, RoundingMode.HALF_UP);
            taxAmount = amount
                    .multiply(new BigDecimal(NumericalConstants.TAX_RATE))
                    .setScale(2, RoundingMode.HALF_UP);
            finalAmount = amount
                    .subtract(feeAmount)
                    .subtract(taxAmount)
                    .setScale(2, RoundingMode.HALF_UP);
        }

        Transaction transaction = new Transaction();
        transaction.setSenderId(senderId);
        transaction.setReceiverId(receiverId);
        transaction.setSourceType(sourceType);
        transaction.setDestinationType(destinationType);
        transaction.setAmount(amount);
        transaction.setFeeAmount(feeAmount);
        transaction.setTaxAmount(taxAmount);
        transaction.setFinalAmount(finalAmount);
        transaction.setStatus(TransactionStatus.PENDING);
        transaction.setTransactionType(type);
        transaction.setDescription(description);
        transaction.setIdempotencyKey(idempotencyKey);
        transaction.setReferenceId("ref_cf_" + UUID.randomUUID().toString().replace("-", ""));

        try {
            return transactionRepository.save(transaction);
        } catch (DataIntegrityViolationException exception) {
            return transactionRepository.findByIdempotencyKey(idempotencyKey)
                    .orElseThrow(() -> exception);
        }
    }

    private TransactionStatus failAfterCompensation(
            String action,
            Transaction transaction,
            boolean compensationSuccessful
    ) {
        transaction.setStatus(compensationSuccessful ? TransactionStatus.FAILED : TransactionStatus.PENDING);

        if (!compensationSuccessful) {
            transaction.setDescription(transaction.getDescription() + " | Compensation pending for " + action);
        }

        transactionRepository.save(transaction);
        return transaction.getStatus();
    }

    private boolean compensateBankCredit(
            String bankToken,
            BigDecimal amount,
            String idempotencyKey,
            String authorization
    ) {
        try {
            BankAccountOperationResponse compensation =
                    pspClient.creditToBankAccount(bankToken, amount, idempotencyKey, authorization);
            return compensation != null && isSuccessful(compensation.status());
        } catch (RuntimeException exception) {
            return false;
        }
    }

    private boolean compensateCardCredit(
            String cardToken,
            BigDecimal amount,
            String idempotencyKey,
            String authorization
    ) {
        try {
            CardOperationResponse compensation =
                    pspClient.creditToCard(cardToken, amount, idempotencyKey, authorization);
            return compensation != null && isSuccessful(compensation.status());
        } catch (RuntimeException exception) {
            return false;
        }
    }

    private void validateIdempotencyKey(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new InvalidFieldException(ErrorMessages.IDEMPOTENCY_KEY_REQUIRED);
        }
    }

    private void validateAmount(BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) {
            throw new InvalidFieldException(ErrorMessages.INVALID_AMOUNT);
        }
    }

    private User resolveReceiverByIdentifier(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            throw new InvalidFieldException("identifier is required");
        }

        return userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByPhoneNumber(identifier))
                .or(() -> userRepository.findByPaymentId(identifier))
                .orElseThrow(() -> new InvalidFieldException(ErrorMessages.INVALID_IDENTIFIER));
    }

    private void validateCardTransferDirection(Card senderCard, User receiver) {
        if (senderCard.getType() == null) {
            throw new InvalidTransactionDirectionException("Card type is required to validate transaction direction");
        }

        boolean receiverIsMerchant = receiver.getRole() == UserRole.MERCHANT;
        if (senderCard.getType() == CardType.CREDIT && !receiverIsMerchant) {
            throw new InvalidTransactionDirectionException(
                    "Credit card transfers are allowed only to merchant accounts"
            );
        }
    }

    // TOP UP (BANK → WALLET)

    @Override
    @Transactional
    public TransactionResultResponse topUpWalletFromBankAccount(
            Long userId,
            WalletTopUpRequest request,
            String authorization,
            String idempotencyKey
    ) {

        validateIdempotencyKey(idempotencyKey);
        validateAmount(request.amount());

        Optional<Transaction> existing = checkIdempotency(idempotencyKey);
        if (existing.isPresent()) return buildResponse(existing.get());

        BankAccount bankAccount = bankAccountRepository
                .findByBankAccountIdAndUser_UserId(request.bankAccountId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", request.bankAccountId()));

        Wallet wallet = walletRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", userId));

        BigDecimal oldWalletBalance = wallet.getBalance();

        Transaction transaction = createTransaction(
                userId,
                userId,
                SourceType.USER_BANK,
                DestinationType.USER_WALLET,
                TransactionType.USER_BANK_TO_SELF_WALLET,
                request.amount(),
                "Wallet top-up from bank account",
                idempotencyKey
        );

        String oldReferenceId = transaction.getReferenceId();
        TransactionStatus oldStatus = transaction.getStatus();

        BankAccountOperationResponse response =
                pspClient.debitFromBankAccount(
                        bankAccount.getToken(),
                        request.amount(),
                        idempotencyKey,
                        authorization
                );

        if (response == null || !isSuccessful(response.status())) {
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);

            auditLogService.log(
                    transaction.getTransactionId(),
                    Literals.TRANSACTION,
                    "TOP-UP-WALLET-FROM-BANK-ACCOUNT",
                    """
                            {
                              "TRANSACTION_ID": %s,
                              "USER_ID": %s,
                              "BANK_ACCOUNT_ID": %s,
                              "AMOUNT": %s,
                              "STATUS": "%s",
                              "REFERENCE_ID": "%s",
                              "WALLET_BALANCE": %s
                            }
                            """.formatted(
                            transaction.getTransactionId(),
                            userId,
                            bankAccount.getBankAccountId(),
                            transaction.getAmount(),
                            oldStatus,
                            oldReferenceId,
                            oldWalletBalance
                    ),
                    """
                            {
                              "TRANSACTION_ID": %s,
                              "USER_ID": %s,
                              "BANK_ACCOUNT_ID": %s,
                              "AMOUNT": %s,
                              "STATUS": "%s",
                              "REFERENCE_ID": "%s",
                              "WALLET_BALANCE": %s
                            }
                            """.formatted(
                            transaction.getTransactionId(),
                            userId,
                            bankAccount.getBankAccountId(),
                            transaction.getAmount(),
                            transaction.getStatus(),
                            transaction.getReferenceId(),
                            oldWalletBalance
                    )
            );

            return buildResponse(transaction);
        }

        Wallet lockedWallet = getWalletForUpdate(userId);
        lockedWallet.setBalance(lockedWallet.getBalance().add(request.amount()));
        walletRepository.save(lockedWallet);

        transaction.setStatus(TransactionStatus.SUCCESSFUL);
        transaction.setReferenceId(response.referenceId());
        transactionRepository.save(transaction);

        auditLogService.log(
                transaction.getTransactionId(),
                Literals.TRANSACTION,
                "TOP-UP-WALLET-FROM-BANK-ACCOUNT",
                """
                        {
                          "TRANSACTION_ID": %s,
                          "USER_ID": %s,
                          "BANK_ACCOUNT_ID": %s,
                          "AMOUNT": %s,
                          "STATUS": "%s",
                          "REFERENCE_ID": "%s",
                          "WALLET_BALANCE": %s
                        }
                        """.formatted(
                        transaction.getTransactionId(),
                        userId,
                        bankAccount.getBankAccountId(),
                        transaction.getAmount(),
                        oldStatus,
                        oldReferenceId,
                        oldWalletBalance
                ),
                """
                        {
                          "TRANSACTION_ID": %s,
                          "USER_ID": %s,
                          "BANK_ACCOUNT_ID": %s,
                          "AMOUNT": %s,
                          "STATUS": "%s",
                          "REFERENCE_ID": "%s",
                          "WALLET_BALANCE": %s
                        }
                        """.formatted(
                        transaction.getTransactionId(),
                        userId,
                        bankAccount.getBankAccountId(),
                        transaction.getAmount(),
                        transaction.getStatus(),
                        transaction.getReferenceId(),
                        lockedWallet.getBalance()
                )
        );

        notificationService.notification(
                userRepository.getReferenceById(userId),
                "Top-up of ₹ " + request.amount() + " was successful",
                NotificationStatus.UNREAD
        );

        return buildResponse(transaction);
    }

    // WITHDRAW (WALLET → BANK)

    @Override
    @Transactional
    public TransactionResultResponse withdrawWalletToBankAccount(
            Long userId,
            WalletWithdrawRequest request,
            String authorization,
            String idempotencyKey
    ) {

        validateIdempotencyKey(idempotencyKey);
        validateAmount(request.amount());

        Optional<Transaction> existing = checkIdempotency(idempotencyKey);
        if (existing.isPresent()) return buildResponse(existing.get());

        Wallet wallet = getWalletForUpdate(userId);

        if (wallet.getBalance().compareTo(request.amount()) < 0) {
            throw new InsufficientBalanceException();
        }

        BankAccount bankAccount = bankAccountRepository
                .findByBankAccountIdAndUser_UserId(request.bankAccountId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", request.bankAccountId()));

        BigDecimal oldWalletBalance = wallet.getBalance();

        Transaction transaction = createTransaction(
                userId,
                userId,
                SourceType.USER_WALLET,
                DestinationType.USER_BANK,
                TransactionType.USER_WALLET_TO_SELF_BANK,
                request.amount(),
                "Withdraw wallet to bank",
                idempotencyKey
        );

        String oldReferenceId = transaction.getReferenceId();
        TransactionStatus oldStatus = transaction.getStatus();

        BankAccountOperationResponse response =
                pspClient.creditToBankAccount(
                        bankAccount.getToken(),
                        request.amount(),
                        idempotencyKey,
                        authorization
                );

        if (response == null || !isSuccessful(response.status())) {
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);

            auditLogService.log(
                    transaction.getTransactionId(),
                    Literals.TRANSACTION,
                    "WITHDRAW-WALLET-TO-BANK-ACCOUNT",
                    """
                            {
                              "TRANSACTION_ID": %s,
                              "USER_ID": %s,
                              "BANK_ACCOUNT_ID": %s,
                              "AMOUNT": %s,
                              "STATUS": "%s",
                              "REFERENCE_ID": "%s",
                              "WALLET_BALANCE": %s
                            }
                            """.formatted(
                            transaction.getTransactionId(),
                            userId,
                            bankAccount.getBankAccountId(),
                            transaction.getAmount(),
                            oldStatus,
                            oldReferenceId,
                            oldWalletBalance
                    ),
                    """
                            {
                              "TRANSACTION_ID": %s,
                              "USER_ID": %s,
                              "BANK_ACCOUNT_ID": %s,
                              "AMOUNT": %s,
                              "STATUS": "%s",
                              "REFERENCE_ID": "%s",
                              "WALLET_BALANCE": %s
                            }
                            """.formatted(
                            transaction.getTransactionId(),
                            userId,
                            bankAccount.getBankAccountId(),
                            transaction.getAmount(),
                            transaction.getStatus(),
                            transaction.getReferenceId(),
                            oldWalletBalance
                    )
            );

            return buildResponse(transaction);
        }

        wallet.setBalance(wallet.getBalance().subtract(request.amount()));
        walletRepository.save(wallet);

        transaction.setStatus(TransactionStatus.SUCCESSFUL);
        transaction.setReferenceId(response.referenceId());
        transactionRepository.save(transaction);

        auditLogService.log(
                transaction.getTransactionId(),
                Literals.TRANSACTION,
                "WITHDRAW-WALLET-TO-BANK-ACCOUNT",
                """
                        {
                          "TRANSACTION_ID": %s,
                          "USER_ID": %s,
                          "BANK_ACCOUNT_ID": %s,
                          "AMOUNT": %s,
                          "STATUS": "%s",
                          "REFERENCE_ID": "%s",
                          "WALLET_BALANCE": %s
                        }
                        """.formatted(
                        transaction.getTransactionId(),
                        userId,
                        bankAccount.getBankAccountId(),
                        transaction.getAmount(),
                        oldStatus,
                        oldReferenceId,
                        oldWalletBalance
                ),
                """
                        {
                          "TRANSACTION_ID": %s,
                          "USER_ID": %s,
                          "BANK_ACCOUNT_ID": %s,
                          "AMOUNT": %s,
                          "STATUS": "%s",
                          "REFERENCE_ID": "%s",
                          "WALLET_BALANCE": %s
                        }
                        """.formatted(
                        transaction.getTransactionId(),
                        userId,
                        bankAccount.getBankAccountId(),
                        transaction.getAmount(),
                        transaction.getStatus(),
                        transaction.getReferenceId(),
                        wallet.getBalance()
                )
        );

        notificationService.notification(
                userRepository.getReferenceById(userId),
                "Withdraw of ₹ " + request.amount() + " was successful",
                NotificationStatus.UNREAD
        );

        return buildResponse(transaction);
    }

    // SEND MONEY

    @Override
    @Transactional
    public TransactionResultResponse sendMoney(
            Long userId,
            SendMoneyRequest request,
            String authorization,
            String idempotencyKey
    ) {

        validateIdempotencyKey(idempotencyKey);
        validateAmount(request.amount());

        Optional<Transaction> existing = checkIdempotency(idempotencyKey);
        if (existing.isPresent()) return buildResponse(existing.get());

        User sender = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        User receiver = resolveReceiverByIdentifier(request.identifier());

        if (receiver.getUserId().equals(sender.getUserId())) {
            throw new InvalidFieldException("Self transfer is not allowed");
        }

        String method = request.paymentMethod();
        if (method == null || method.isBlank()) {
            throw new InvalidFieldException("Invalid payment method");
        }

        return switch (method.toUpperCase()) {
            case "WALLET" -> handleWalletToUserBank(sender, receiver, request.amount(), authorization, idempotencyKey);
            case "BANK" ->
                    handleBankToUserBank(sender, receiver, request.bankAccountId(), request.amount(), authorization, idempotencyKey);
            case "CARD" ->
                    handleCardToUserBank(sender, receiver, request.cardId(), request.amount(), authorization, idempotencyKey);
            default -> throw new InvalidFieldException("Invalid payment method");
        };
    }

    // SEND MONEY HANDLERS

    private TransactionResultResponse handleWalletToUserBank(
            User sender,
            User receiver,
            BigDecimal amount,
            String authorization,
            String idempotencyKey
    ) {

        Wallet senderWallet = getWalletForUpdate(sender.getUserId());

        if (senderWallet.getBalance().compareTo(amount) < 0) {
            throw new InsufficientBalanceException();
        }

        BankAccount receiverBank = bankAccountRepository
                .findByUser_UserIdAndIsDefaultTrueAndIsActiveTrue(receiver.getUserId())
                .orElseThrow(() -> new OwnershipViolationException("Receiver has no default active bank account"));

        BigDecimal oldSenderWalletBalance = senderWallet.getBalance();

        Transaction transaction = createTransaction(
                sender.getUserId(),
                receiver.getUserId(),
                SourceType.USER_WALLET,
                DestinationType.USER_BANK,
                TransactionType.USER_WALLET_TO_USER_BANK,
                amount,
                "Wallet to user bank transfer",
                idempotencyKey
        );

        String oldReferenceId = transaction.getReferenceId();
        TransactionStatus oldStatus = transaction.getStatus();

        BankAccountOperationResponse response =
                pspClient.creditToBankAccount(
                        receiverBank.getToken(),
                        transaction.getFinalAmount(),
                        idempotencyKey,
                        authorization
                );

        if (response == null || !isSuccessful(response.status())) {
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);

            auditLogService.log(
                    transaction.getTransactionId(),
                    Literals.TRANSACTION,
                    "SEND-MONEY-WALLET-TO-USER-BANK",
                    """
                            {
                              "TRANSACTION_ID": %s,
                              "SENDER_ID": %s,
                              "RECEIVER_ID": %s,
                              "AMOUNT": %s,
                              "FINAL_AMOUNT": %s,
                              "FEE_AMOUNT": %s,
                              "TAX_AMOUNT": %s,
                              "STATUS": "%s",
                              "REFERENCE_ID": "%s",
                              "SENDER_WALLET_BALANCE": %s
                            }
                            """.formatted(
                            transaction.getTransactionId(),
                            sender.getUserId(),
                            receiver.getUserId(),
                            transaction.getAmount(),
                            transaction.getFinalAmount(),
                            transaction.getFeeAmount(),
                            transaction.getTaxAmount(),
                            oldStatus,
                            oldReferenceId,
                            oldSenderWalletBalance
                    ),
                    """
                            {
                              "TRANSACTION_ID": %s,
                              "SENDER_ID": %s,
                              "RECEIVER_ID": %s,
                              "AMOUNT": %s,
                              "FINAL_AMOUNT": %s,
                              "FEE_AMOUNT": %s,
                              "TAX_AMOUNT": %s,
                              "STATUS": "%s",
                              "REFERENCE_ID": "%s",
                              "SENDER_WALLET_BALANCE": %s
                            }
                            """.formatted(
                            transaction.getTransactionId(),
                            sender.getUserId(),
                            receiver.getUserId(),
                            transaction.getAmount(),
                            transaction.getFinalAmount(),
                            transaction.getFeeAmount(),
                            transaction.getTaxAmount(),
                            transaction.getStatus(),
                            transaction.getReferenceId(),
                            oldSenderWalletBalance
                    )
            );

            return buildResponse(transaction);
        }

        senderWallet.setBalance(senderWallet.getBalance().subtract(amount));
        walletRepository.save(senderWallet);

        if (transaction.getStatus() != TransactionStatus.SUCCESSFUL) {
            transaction.setStatus(TransactionStatus.SUCCESSFUL);
            transaction.setReferenceId(response.referenceId());
            addFeeToAdminWallet(transaction.getFeeAmount());
            transactionRepository.save(transaction);
        }

        auditLogService.log(
                transaction.getTransactionId(),
                Literals.TRANSACTION,
                "SEND-MONEY-WALLET-TO-USER-BANK",
                """
                        {
                          "TRANSACTION_ID": %s,
                          "SENDER_ID": %s,
                          "RECEIVER_ID": %s,
                          "AMOUNT": %s,
                          "FINAL_AMOUNT": %s,
                          "FEE_AMOUNT": %s,
                          "TAX_AMOUNT": %s,
                          "STATUS": "%s",
                          "REFERENCE_ID": "%s",
                          "SENDER_WALLET_BALANCE": %s
                        }
                        """.formatted(
                        transaction.getTransactionId(),
                        sender.getUserId(),
                        receiver.getUserId(),
                        transaction.getAmount(),
                        transaction.getFinalAmount(),
                        transaction.getFeeAmount(),
                        transaction.getTaxAmount(),
                        oldStatus,
                        oldReferenceId,
                        oldSenderWalletBalance
                ),
                """
                        {
                          "TRANSACTION_ID": %s,
                          "SENDER_ID": %s,
                          "RECEIVER_ID": %s,
                          "AMOUNT": %s,
                          "FINAL_AMOUNT": %s,
                          "FEE_AMOUNT": %s,
                          "TAX_AMOUNT": %s,
                          "STATUS": "%s",
                          "REFERENCE_ID": "%s",
                          "SENDER_WALLET_BALANCE": %s
                        }
                        """.formatted(
                        transaction.getTransactionId(),
                        sender.getUserId(),
                        receiver.getUserId(),
                        transaction.getAmount(),
                        transaction.getFinalAmount(),
                        transaction.getFeeAmount(),
                        transaction.getTaxAmount(),
                        transaction.getStatus(),
                        transaction.getReferenceId(),
                        senderWallet.getBalance()
                )
        );

        notificationService.notification(
                sender,
                "You sent ₹ " + amount + " to " + receiver.getFullName() + " successfully",
                NotificationStatus.UNREAD
        );

        notificationService.notification(
                receiver,
                "You received ₹ " + transaction.getFinalAmount() + " from " + sender.getFullName() + " successfully",
                NotificationStatus.UNREAD
        );

        return buildResponse(transaction);
    }

    private TransactionResultResponse handleBankToUserBank(
            User sender,
            User receiver,
            Long senderBankAccountId,
            BigDecimal amount,
            String authorization,
            String idempotencyKey
    ) {

        if (senderBankAccountId == null) {
            throw new InvalidFieldException("bankAccountId is required for BANK payment method");
        }

        BankAccount senderBank = bankAccountRepository
                .findByBankAccountIdAndUser_UserId(senderBankAccountId, sender.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", senderBankAccountId));

        BankAccount receiverBank = bankAccountRepository
                .findByUser_UserIdAndIsDefaultTrueAndIsActiveTrue(receiver.getUserId())
                .orElseThrow(() -> new OwnershipViolationException("Receiver has no default active bank account"));

        Transaction transaction = createTransaction(
                sender.getUserId(),
                receiver.getUserId(),
                SourceType.USER_BANK,
                DestinationType.USER_BANK,
                TransactionType.USER_BANK_TO_USER_BANK,
                amount,
                "Bank to user bank transfer",
                idempotencyKey
        );

        String oldReferenceId = transaction.getReferenceId();
        TransactionStatus oldStatus = transaction.getStatus();

        BankAccountOperationResponse debit =
                pspClient.debitFromBankAccount(
                        senderBank.getToken(),
                        amount,
                        idempotencyKey,
                        authorization
                );

        if (debit == null || !isSuccessful(debit.status())) {
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);

            auditLogService.log(
                    transaction.getTransactionId(),
                    Literals.TRANSACTION,
                    "SEND-MONEY-BANK-TO-USER-BANK",
                    """
                            {
                              "TRANSACTION_ID": %s,
                              "SENDER_ID": %s,
                              "RECEIVER_ID": %s,
                              "SENDER_BANK_ACCOUNT_ID": %s,
                              "RECEIVER_BANK_ACCOUNT_ID": %s,
                              "AMOUNT": %s,
                              "FINAL_AMOUNT": %s,
                              "FEE_AMOUNT": %s,
                              "TAX_AMOUNT": %s,
                              "STATUS": "%s",
                              "REFERENCE_ID": "%s"
                            }
                            """.formatted(
                            transaction.getTransactionId(),
                            sender.getUserId(),
                            receiver.getUserId(),
                            senderBank.getBankAccountId(),
                            receiverBank.getBankAccountId(),
                            transaction.getAmount(),
                            transaction.getFinalAmount(),
                            transaction.getFeeAmount(),
                            transaction.getTaxAmount(),
                            oldStatus,
                            oldReferenceId
                    ),
                    """
                            {
                              "TRANSACTION_ID": %s,
                              "SENDER_ID": %s,
                              "RECEIVER_ID": %s,
                              "SENDER_BANK_ACCOUNT_ID": %s,
                              "RECEIVER_BANK_ACCOUNT_ID": %s,
                              "AMOUNT": %s,
                              "FINAL_AMOUNT": %s,
                              "FEE_AMOUNT": %s,
                              "TAX_AMOUNT": %s,
                              "STATUS": "%s",
                              "REFERENCE_ID": "%s"
                            }
                            """.formatted(
                            transaction.getTransactionId(),
                            sender.getUserId(),
                            receiver.getUserId(),
                            senderBank.getBankAccountId(),
                            receiverBank.getBankAccountId(),
                            transaction.getAmount(),
                            transaction.getFinalAmount(),
                            transaction.getFeeAmount(),
                            transaction.getTaxAmount(),
                            transaction.getStatus(),
                            transaction.getReferenceId()
                    )
            );

            return buildResponse(transaction);
        }

        BankAccountOperationResponse credit =
                pspClient.creditToBankAccount(
                        receiverBank.getToken(),
                        transaction.getFinalAmount(),
                        idempotencyKey,
                        authorization
                );

        if (credit == null || !isSuccessful(credit.status())) {
            TransactionStatus failedStatus = failAfterCompensation(
                    "BANK_TO_USER_BANK",
                    transaction,
                    compensateBankCredit(senderBank.getToken(), amount, idempotencyKey, authorization)
            );

            auditLogService.log(
                    transaction.getTransactionId(),
                    Literals.TRANSACTION,
                    "SEND-MONEY-BANK-TO-USER-BANK",
                    """
                            {
                              "TRANSACTION_ID": %s,
                              "SENDER_ID": %s,
                              "RECEIVER_ID": %s,
                              "SENDER_BANK_ACCOUNT_ID": %s,
                              "RECEIVER_BANK_ACCOUNT_ID": %s,
                              "AMOUNT": %s,
                              "FINAL_AMOUNT": %s,
                              "FEE_AMOUNT": %s,
                              "TAX_AMOUNT": %s,
                              "STATUS": "%s",
                              "REFERENCE_ID": "%s"
                            }
                            """.formatted(
                            transaction.getTransactionId(),
                            sender.getUserId(),
                            receiver.getUserId(),
                            senderBank.getBankAccountId(),
                            receiverBank.getBankAccountId(),
                            transaction.getAmount(),
                            transaction.getFinalAmount(),
                            transaction.getFeeAmount(),
                            transaction.getTaxAmount(),
                            oldStatus,
                            oldReferenceId
                    ),
                    """
                            {
                              "TRANSACTION_ID": %s,
                              "SENDER_ID": %s,
                              "RECEIVER_ID": %s,
                              "SENDER_BANK_ACCOUNT_ID": %s,
                              "RECEIVER_BANK_ACCOUNT_ID": %s,
                              "AMOUNT": %s,
                              "FINAL_AMOUNT": %s,
                              "FEE_AMOUNT": %s,
                              "TAX_AMOUNT": %s,
                              "STATUS": "%s",
                              "REFERENCE_ID": "%s"
                            }
                            """.formatted(
                            transaction.getTransactionId(),
                            sender.getUserId(),
                            receiver.getUserId(),
                            senderBank.getBankAccountId(),
                            receiverBank.getBankAccountId(),
                            transaction.getAmount(),
                            transaction.getFinalAmount(),
                            transaction.getFeeAmount(),
                            transaction.getTaxAmount(),
                            failedStatus,
                            transaction.getReferenceId()
                    )
            );

            return buildResponse(transaction);
        }

        if (transaction.getStatus() != TransactionStatus.SUCCESSFUL) {
            transaction.setStatus(TransactionStatus.SUCCESSFUL);
            transaction.setReferenceId(credit.referenceId());
            addFeeToAdminWallet(transaction.getFeeAmount());
            transactionRepository.save(transaction);
        }

        auditLogService.log(
                transaction.getTransactionId(),
                Literals.TRANSACTION,
                "SEND-MONEY-BANK-TO-USER-BANK",
                """
                        {
                          "TRANSACTION_ID": %s,
                          "SENDER_ID": %s,
                          "RECEIVER_ID": %s,
                          "SENDER_BANK_ACCOUNT_ID": %s,
                          "RECEIVER_BANK_ACCOUNT_ID": %s,
                          "AMOUNT": %s,
                          "FINAL_AMOUNT": %s,
                          "FEE_AMOUNT": %s,
                          "TAX_AMOUNT": %s,
                          "STATUS": "%s",
                          "REFERENCE_ID": "%s"
                        }
                        """.formatted(
                        transaction.getTransactionId(),
                        sender.getUserId(),
                        receiver.getUserId(),
                        senderBank.getBankAccountId(),
                        receiverBank.getBankAccountId(),
                        transaction.getAmount(),
                        transaction.getFinalAmount(),
                        transaction.getFeeAmount(),
                        transaction.getTaxAmount(),
                        oldStatus,
                        oldReferenceId
                ),
                """
                        {
                          "TRANSACTION_ID": %s,
                          "SENDER_ID": %s,
                          "RECEIVER_ID": %s,
                          "SENDER_BANK_ACCOUNT_ID": %s,
                          "RECEIVER_BANK_ACCOUNT_ID": %s,
                          "AMOUNT": %s,
                          "FINAL_AMOUNT": %s,
                          "FEE_AMOUNT": %s,
                          "TAX_AMOUNT": %s,
                          "STATUS": "%s",
                          "REFERENCE_ID": "%s"
                        }
                        """.formatted(
                        transaction.getTransactionId(),
                        sender.getUserId(),
                        receiver.getUserId(),
                        senderBank.getBankAccountId(),
                        receiverBank.getBankAccountId(),
                        transaction.getAmount(),
                        transaction.getFinalAmount(),
                        transaction.getFeeAmount(),
                        transaction.getTaxAmount(),
                        transaction.getStatus(),
                        transaction.getReferenceId()
                )
        );

        notificationService.notification(
                sender,
                "You sent ₹ " + amount + " to " + receiver.getFullName() + " successfully",
                NotificationStatus.UNREAD
        );

        notificationService.notification(
                receiver,
                "You received ₹ " + transaction.getFinalAmount() + " from " + sender.getFullName() + " successfully",
                NotificationStatus.UNREAD
        );

        return buildResponse(transaction);
    }

    private TransactionResultResponse handleCardToUserBank(
            User sender,
            User receiver,
            Long cardId,
            BigDecimal amount,
            String authorization,
            String idempotencyKey
    ) {

        if (cardId == null) {
            throw new InvalidFieldException("cardId is required for CARD payment method");
        }

        Card senderCard = cardRepository.findActiveByCardIdAndUserId(cardId, sender.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Card", cardId));

        validateCardTransferDirection(senderCard, receiver);

        BankAccount receiverBank = bankAccountRepository
                .findByUser_UserIdAndIsDefaultTrueAndIsActiveTrue(receiver.getUserId())
                .orElseThrow(() -> new OwnershipViolationException("Receiver has no default active bank account"));

        Transaction transaction = createTransaction(
                sender.getUserId(),
                receiver.getUserId(),
                SourceType.USER_CARD,
                DestinationType.USER_BANK,
                TransactionType.USER_CARD_TO_USER_BANK,
                amount,
                "Card to user bank transfer",
                idempotencyKey
        );

        String oldReferenceId = transaction.getReferenceId();
        TransactionStatus oldStatus = transaction.getStatus();

        CardOperationResponse debit =
                pspClient.debitFromCard(
                        senderCard.getToken(),
                        amount,
                        idempotencyKey,
                        authorization
                );

        if (debit == null || !isSuccessful(debit.status())) {
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);

            auditLogService.log(
                    transaction.getTransactionId(),
                    Literals.TRANSACTION,
                    "SEND-MONEY-CARD-TO-USER-BANK",
                    """
                            {
                              "TRANSACTION_ID": %s,
                              "SENDER_ID": %s,
                              "RECEIVER_ID": %s,
                              "CARD_ID": %s,
                              "RECEIVER_BANK_ACCOUNT_ID": %s,
                              "AMOUNT": %s,
                              "FINAL_AMOUNT": %s,
                              "FEE_AMOUNT": %s,
                              "TAX_AMOUNT": %s,
                              "STATUS": "%s",
                              "REFERENCE_ID": "%s"
                            }
                            """.formatted(
                            transaction.getTransactionId(),
                            sender.getUserId(),
                            receiver.getUserId(),
                            senderCard.getCardId(),
                            receiverBank.getBankAccountId(),
                            transaction.getAmount(),
                            transaction.getFinalAmount(),
                            transaction.getFeeAmount(),
                            transaction.getTaxAmount(),
                            oldStatus,
                            oldReferenceId
                    ),
                    """
                            {
                              "TRANSACTION_ID": %s,
                              "SENDER_ID": %s,
                              "RECEIVER_ID": %s,
                              "CARD_ID": %s,
                              "RECEIVER_BANK_ACCOUNT_ID": %s,
                              "AMOUNT": %s,
                              "FINAL_AMOUNT": %s,
                              "FEE_AMOUNT": %s,
                              "TAX_AMOUNT": %s,
                              "STATUS": "%s",
                              "REFERENCE_ID": "%s"
                            }
                            """.formatted(
                            transaction.getTransactionId(),
                            sender.getUserId(),
                            receiver.getUserId(),
                            senderCard.getCardId(),
                            receiverBank.getBankAccountId(),
                            transaction.getAmount(),
                            transaction.getFinalAmount(),
                            transaction.getFeeAmount(),
                            transaction.getTaxAmount(),
                            transaction.getStatus(),
                            transaction.getReferenceId()
                    )
            );

            return buildResponse(transaction);
        }

        BankAccountOperationResponse credit =
                pspClient.creditToBankAccount(
                        receiverBank.getToken(),
                        transaction.getFinalAmount(),
                        idempotencyKey,
                        authorization
                );

        if (credit == null || !isSuccessful(credit.status())) {
            TransactionStatus failedStatus = failAfterCompensation(
                    "CARD_TO_USER_BANK",
                    transaction,
                    compensateCardCredit(senderCard.getToken(), amount, idempotencyKey, authorization)
            );

            auditLogService.log(
                    transaction.getTransactionId(),
                    Literals.TRANSACTION,
                    "SEND-MONEY-CARD-TO-USER-BANK",
                    """
                            {
                              "TRANSACTION_ID": %s,
                              "SENDER_ID": %s,
                              "RECEIVER_ID": %s,
                              "CARD_ID": %s,
                              "RECEIVER_BANK_ACCOUNT_ID": %s,
                              "AMOUNT": %s,
                              "FINAL_AMOUNT": %s,
                              "FEE_AMOUNT": %s,
                              "TAX_AMOUNT": %s,
                              "STATUS": "%s",
                              "REFERENCE_ID": "%s"
                            }
                            """.formatted(
                            transaction.getTransactionId(),
                            sender.getUserId(),
                            receiver.getUserId(),
                            senderCard.getCardId(),
                            receiverBank.getBankAccountId(),
                            transaction.getAmount(),
                            transaction.getFinalAmount(),
                            transaction.getFeeAmount(),
                            transaction.getTaxAmount(),
                            oldStatus,
                            oldReferenceId
                    ),
                    """
                            {
                              "TRANSACTION_ID": %s,
                              "SENDER_ID": %s,
                              "RECEIVER_ID": %s,
                              "CARD_ID": %s,
                              "RECEIVER_BANK_ACCOUNT_ID": %s,
                              "AMOUNT": %s,
                              "FINAL_AMOUNT": %s,
                              "FEE_AMOUNT": %s,
                              "TAX_AMOUNT": %s,
                              "STATUS": "%s",
                              "REFERENCE_ID": "%s"
                            }
                            """.formatted(
                            transaction.getTransactionId(),
                            sender.getUserId(),
                            receiver.getUserId(),
                            senderCard.getCardId(),
                            receiverBank.getBankAccountId(),
                            transaction.getAmount(),
                            transaction.getFinalAmount(),
                            transaction.getFeeAmount(),
                            transaction.getTaxAmount(),
                            failedStatus,
                            transaction.getReferenceId()
                    )
            );

            return buildResponse(transaction);
        }

        if (transaction.getStatus() != TransactionStatus.SUCCESSFUL) {
            transaction.setStatus(TransactionStatus.SUCCESSFUL);
            transaction.setReferenceId(credit.referenceId());
            addFeeToAdminWallet(transaction.getFeeAmount());
            transactionRepository.save(transaction);
        }

        auditLogService.log(
                transaction.getTransactionId(),
                Literals.TRANSACTION,
                "SEND-MONEY-CARD-TO-USER-BANK",
                """
                        {
                          "TRANSACTION_ID": %s,
                          "SENDER_ID": %s,
                          "RECEIVER_ID": %s,
                          "CARD_ID": %s,
                          "RECEIVER_BANK_ACCOUNT_ID": %s,
                          "AMOUNT": %s,
                          "FINAL_AMOUNT": %s,
                          "FEE_AMOUNT": %s,
                          "TAX_AMOUNT": %s,
                          "STATUS": "%s",
                          "REFERENCE_ID": "%s"
                        }
                        """.formatted(
                        transaction.getTransactionId(),
                        sender.getUserId(),
                        receiver.getUserId(),
                        senderCard.getCardId(),
                        receiverBank.getBankAccountId(),
                        transaction.getAmount(),
                        transaction.getFinalAmount(),
                        transaction.getFeeAmount(),
                        transaction.getTaxAmount(),
                        oldStatus,
                        oldReferenceId
                ),
                """
                        {
                          "TRANSACTION_ID": %s,
                          "SENDER_ID": %s,
                          "RECEIVER_ID": %s,
                          "CARD_ID": %s,
                          "RECEIVER_BANK_ACCOUNT_ID": %s,
                          "AMOUNT": %s,
                          "FINAL_AMOUNT": %s,
                          "FEE_AMOUNT": %s,
                          "TAX_AMOUNT": %s,
                          "STATUS": "%s",
                          "REFERENCE_ID": "%s"
                        }
                        """.formatted(
                        transaction.getTransactionId(),
                        sender.getUserId(),
                        receiver.getUserId(),
                        senderCard.getCardId(),
                        receiverBank.getBankAccountId(),
                        transaction.getAmount(),
                        transaction.getFinalAmount(),
                        transaction.getFeeAmount(),
                        transaction.getTaxAmount(),
                        transaction.getStatus(),
                        transaction.getReferenceId()
                )
        );

        notificationService.notification(
                sender,
                "You sent ₹ " + amount + " to " + receiver.getFullName() + " successfully",
                NotificationStatus.UNREAD
        );

        notificationService.notification(
                receiver,
                "You received ₹ " + transaction.getFinalAmount() + " from " + sender.getFullName() + " successfully",
                NotificationStatus.UNREAD
        );

        return buildResponse(transaction);
    }
}
