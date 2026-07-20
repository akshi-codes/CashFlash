package com.endava.cashflash.service.impl;

import com.endava.cashflash.client.PspClient;
import com.endava.cashflash.constants.CacheNames;
import com.endava.cashflash.constants.Literals;
import com.endava.cashflash.dto.request.AddCardRequest;
import com.endava.cashflash.dto.response.AddCardResponse;
import com.endava.cashflash.enums.NotificationStatus;
import com.endava.cashflash.exception.OwnershipViolationException;
import com.endava.cashflash.exception.ResourceNotFoundException;
import com.endava.cashflash.model.Card;
import com.endava.cashflash.model.User;
import com.endava.cashflash.repository.CardRepository;
import com.endava.cashflash.repository.UserRepository;
import com.endava.cashflash.service.AuditLogService;
import com.endava.cashflash.service.CardService;
import com.endava.cashflash.service.NotificationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CardServiceImpl implements CardService {

    private final UserRepository userRepository;
    private final CardRepository cardRepository;
    private final PspClient pspClient;
    private final AuditLogService auditLogService; // Audit log service for tracking card actions
    private final NotificationService notificationService;

    /**
     * Adds a card for the given user by verifying it via PSP and saving it locally.
     * @param userId user identifier
     * @param request card details to verify and link
     * @param authorizationHeader auth header forwarded to PSP service
     * @return PSP response containing verified card details and token
     * @throws ResourceNotFoundException when user is not found
     */
    @Override
    @Transactional
    @CacheEvict(cacheNames = CacheNames.PAYMENT_METHODS_BY_USER, key = "#userId")
    public AddCardResponse addCard(
            Long userId,
            AddCardRequest request,
            String authorizationHeader
    ) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(Literals.USER_RESOURCE, userId)); // Validates user exists

        AddCardResponse pspResponse = pspClient.verifyCard(
                request,
                authorizationHeader
        ); // Verifies card via PSP

        boolean firstCard = cardRepository.countByUser_UserId(userId) == 0; // Checks if this is the user's first card
        boolean makeDefault = Boolean.TRUE.equals(request.isDefault()) || firstCard; // Makes default if requested or first card

        if (makeDefault) {
            cardRepository.clearDefaultCardForUser(userId); // Clears existing default before setting the new one
        }

        Card card = new Card();
        card.setUser(user);
        card.setProvider(pspResponse.provider());
        card.setType(pspResponse.type());
        card.setLast4(pspResponse.last4());
        card.setExpiryMonth(pspResponse.expiryMonth());
        card.setExpiryYear(pspResponse.expiryYear());
        card.setToken(pspResponse.token());
        card.setIsDefault(makeDefault);

        cardRepository.save(card); // Saves linked card for the user

        auditLogService.log(
                userId,
                Literals.CARD,
                Literals.ADD_CARD,
                null,
                """
                {
                  "PROVIDER": "%s",
                  "TYPE": "%s",
                  "LAST4": "%s",
                  "EXPIRY_MONTH": "%s",
                  "EXPIRY_YEAR": "%s",
                  "IS_DEFAULT": "%s",
                  "STATUS": "%s"
                }
                """.formatted(
                        pspResponse.provider(),
                        pspResponse.type(),
                        pspResponse.last4(),
                        pspResponse.expiryMonth(),
                        pspResponse.expiryYear(),
                        makeDefault,
                        Literals.SUCCESSFUL
                )
        ); // Audit log for card linking

        notificationService.notification(
                user,
                Literals.CARD_ADDED_MESSAGE.formatted(pspResponse.last4()),
                NotificationStatus.UNREAD
        );

        return pspResponse; // Returns verified PSP response
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CacheNames.PAYMENT_METHODS_BY_USER, key = "#userId")
    public void setDefaultCard(
            Long cardId,
            Long userId
    ) {

        CardUpdateContext context = getCardUpdateContext(cardId, userId);
        Card card = context.card();

        cardRepository.clearDefaultCardForUser(userId); // Clears existing default before setting the new one

        card.setIsDefault(true);
        cardRepository.save(card);

        auditLogService.log(
                userId,
                Literals.CARD,
                Literals.CHANGE_DEFAULT_CARD,
                """
                {
                  "CARD_PROVIDER": "%s",
                  "TYPE": "%s",
                  "LAST4": "%s",
                  "TOKEN": "%s",
                  "IS_DEFAULT": %s,
                  "IS_ACTIVE": %s
                }
                """.formatted(
                        card.getProvider(),
                        card.getType(),
                        card.getLast4(),
                        card.getToken(),
                        context.oldIsDefault(),
                        context.oldIsActive()
                ),
                """
                {
                  "CARD_PROVIDER": "%s",
                  "TYPE": "%s",
                  "LAST4": "%s",
                  "TOKEN": "%s",
                  "IS_DEFAULT": %s,
                  "IS_ACTIVE": %s
                }
                """.formatted(
                        card.getProvider(),
                        card.getType(),
                        card.getLast4(),
                        card.getToken(),
                        card.getIsDefault(),
                        card.getIsActive()
                )
        ); // Audit log for changing default card

        notificationService.notification(
                card.getUser(),
                Literals.CARD_DEFAULT_MESSAGE.formatted(card.getLast4()),
                NotificationStatus.UNREAD
        );
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CacheNames.PAYMENT_METHODS_BY_USER, key = "#userId")
    public void deactivateCard(
            Long cardId,
            Long userId
    ) {

        CardUpdateContext context = getCardUpdateContext(cardId, userId);
        Card card = context.card();

        if (Boolean.TRUE.equals(card.getIsDefault())) {
            card.setIsDefault(false); // Removes default flag when deactivating the default card
        }

        card.setIsActive(false);
        cardRepository.save(card);

        auditLogService.log(
                userId,
                Literals.CARD,
                Literals.DEACTIVATE_CARD,
                """
                {
                  "CARD_PROVIDER": "%s",
                  "TYPE": "%s",
                  "LAST4": "%s",
                  "TOKEN": "%s",
                  "IS_DEFAULT": %s,
                  "IS_ACTIVE": %s
                }
                """.formatted(
                        card.getProvider(),
                        card.getType(),
                        card.getLast4(),
                        card.getToken(),
                        context.oldIsDefault(),
                        context.oldIsActive()
                ),
                """
                {
                  "CARD_PROVIDER": "%s",
                  "TYPE": "%s",
                  "LAST4": "%s",
                  "TOKEN": "%s",
                  "IS_DEFAULT": %s,
                  "IS_ACTIVE": %s
                }
                """.formatted(
                        card.getProvider(),
                        card.getType(),
                        card.getLast4(),
                        card.getToken(),
                        card.getIsDefault(),
                        card.getIsActive()
                )
        ); // Audit log for deactivating card

        notificationService.notification(
                card.getUser(),
                Literals.CARD_DEACTIVATED_MESSAGE.formatted(card.getLast4()),
                NotificationStatus.UNREAD
        );
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CacheNames.PAYMENT_METHODS_BY_USER, key = "#userId")
    public void activateCard(
            Long cardId,
            Long userId
    ) {

        CardUpdateContext context = getCardUpdateContext(cardId, userId);
        Card card = context.card();

        if (Boolean.TRUE.equals(card.getIsActive())) {
            return; // Skips update when the card is already active
        }

        card.setIsActive(true);
        cardRepository.save(card);

        auditLogService.log(
                userId,
                Literals.CARD,
                Literals.ACTIVATE_CARD,
                """
                {
                  "CARD_PROVIDER": "%s",
                  "TYPE": "%s",
                  "LAST4": "%s",
                  "TOKEN": "%s",
                  "IS_DEFAULT": %s,
                  "IS_ACTIVE": %s
                }
                """.formatted(
                        card.getProvider(),
                        card.getType(),
                        card.getLast4(),
                        card.getToken(),
                        context.oldIsDefault(),
                        context.oldIsActive()
                ),
                """
                {
                  "CARD_PROVIDER": "%s",
                  "TYPE": "%s",
                  "LAST4": "%s",
                  "TOKEN": "%s",
                  "IS_DEFAULT": %s,
                  "IS_ACTIVE": %s
                }
                """.formatted(
                        card.getProvider(),
                        card.getType(),
                        card.getLast4(),
                        card.getToken(),
                        card.getIsDefault(),
                        card.getIsActive()
                )
        ); // Audit log for activating card

        notificationService.notification(
                card.getUser(),
                Literals.CARD_ACTIVATED_MESSAGE.formatted(card.getLast4()),
                NotificationStatus.UNREAD
        );
    }

    private CardUpdateContext getCardUpdateContext(
            Long cardId,
            Long userId
    ) {

        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException(Literals.CARD_RESOURCE, cardId)); // Fetches card by id

        if (!card.getUser().getUserId().equals(userId)) {
            throw new OwnershipViolationException(Literals.CARD_OWNERSHIP_MESSAGE); // Validates card ownership
        }

        return new CardUpdateContext(
                card,
                card.getIsDefault(),
                card.getIsActive()
        ); // Captures old state before any update
    }

    private record CardUpdateContext(
            Card card,
            Boolean oldIsDefault,
            Boolean oldIsActive
    ) {
    }
}