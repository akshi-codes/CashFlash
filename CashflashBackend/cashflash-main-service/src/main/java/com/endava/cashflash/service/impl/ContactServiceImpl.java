package com.endava.cashflash.service.impl;

import com.endava.cashflash.constants.CacheNames;
import com.endava.cashflash.constants.Literals;
import com.endava.cashflash.dto.request.AddContactRequest;
import com.endava.cashflash.dto.request.RemoveTrustedRequest;
import com.endava.cashflash.dto.request.SetTrustedRequest;
import com.endava.cashflash.dto.response.AddContactResponse;
import com.endava.cashflash.dto.response.RemoveTrustedResponse;
import com.endava.cashflash.dto.response.SetTrustedResponse;
import com.endava.cashflash.enums.NotificationStatus;
import com.endava.cashflash.exception.ResourceNotFoundException;
import com.endava.cashflash.model.Contact;
import com.endava.cashflash.model.User;
import com.endava.cashflash.repository.ContactRepository;
import com.endava.cashflash.repository.UserRepository;
import com.endava.cashflash.service.AuditLogService;
import com.endava.cashflash.service.ContactService;
import com.endava.cashflash.service.NotificationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ContactServiceImpl implements ContactService {

    private final UserRepository userRepository;
    private final ContactRepository contactRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    @Override
    @Cacheable(cacheNames = CacheNames.CONTACTS_BY_USER, key = "#userId")
    public List<Contact> getAllContacts(Long userId) {
        return contactRepository.findByUser_UserIdOrderByAliasAsc(userId); // Returns contacts sorted by alias
    }

    @Override
    @CacheEvict(cacheNames = CacheNames.CONTACTS_BY_USER, key = "#userId")
    public AddContactResponse addContact(
            Long userId,
            AddContactRequest request
    ) {
        User user = findUserById(userId);

        Contact contact = new Contact();
        contact.setUser(user);
        contact.setAlias(request.alias().trim());
        contact.setIdentifierType(request.identifierType());
        contact.setIdentifierValue(request.identifierValue().trim());
        contact.setIsTrusted(false);

        contactRepository.save(contact); // Saves the new contact for the user

        auditLogService.log(
                userId,
                Literals.CONTACT,
                Literals.ADD_CONTACT,
                null,
                """
                {
                  "CONTACT_ID": %s,
                  "ALIAS": "%s",
                  "IDENTIFIER_TYPE": "%s",
                  "IDENTIFIER_VALUE": "%s",
                  "IS_TRUSTED": %s
                }
                """.formatted(
                        contact.getContactId(),
                        contact.getAlias(),
                        contact.getIdentifierType(),
                        contact.getIdentifierValue(),
                        contact.getIsTrusted()
                )
        ); // Audit log for contact creation

        notificationService.notification(
                user,
                Literals.CONTACT_ADDED_MESSAGE.formatted(contact.getAlias()),
                NotificationStatus.UNREAD
        );

        return new AddContactResponse(
                contact.getContactId(),
                contact.getUser().getUserId(),
                contact.getAlias(),
                contact.getIdentifierType(),
                contact.getIdentifierValue(),
                contact.getIsTrusted()
        );
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CacheNames.CONTACTS_BY_USER, key = "#userId")
    public SetTrustedResponse setTrusted(
            Long userId,
            SetTrustedRequest request
    ) {
        User user = findUserById(userId);
        Contact contact = findContactByIdAndUserId(request.contactId(), userId);

        Boolean oldIsTrusted = contact.getIsTrusted(); // Captures old state for audit logging

        contact.setIsTrusted(true);
        contactRepository.save(contact);

        auditLogService.log(
                userId,
                Literals.CONTACT,
                Literals.SET_TRUSTED_CONTACT,
                """
                {
                  "CONTACT_ID": %s,
                  "ALIAS": "%s",
                  "IDENTIFIER_TYPE": "%s",
                  "IDENTIFIER_VALUE": "%s",
                  "IS_TRUSTED": %s
                }
                """.formatted(
                        contact.getContactId(),
                        contact.getAlias(),
                        contact.getIdentifierType(),
                        contact.getIdentifierValue(),
                        oldIsTrusted
                ),
                """
                {
                  "CONTACT_ID": %s,
                  "ALIAS": "%s",
                  "IDENTIFIER_TYPE": "%s",
                  "IDENTIFIER_VALUE": "%s",
                  "IS_TRUSTED": %s
                }
                """.formatted(
                        contact.getContactId(),
                        contact.getAlias(),
                        contact.getIdentifierType(),
                        contact.getIdentifierValue(),
                        contact.getIsTrusted()
                )
        ); // Audit log for marking contact as trusted

        notificationService.notification(
                user,
                Literals.CONTACT_TRUSTED_MESSAGE.formatted(contact.getAlias()),
                NotificationStatus.UNREAD
        );

        return new SetTrustedResponse(
                contact.getContactId(),
                contact.getIsTrusted()
        );
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CacheNames.CONTACTS_BY_USER, key = "#userId")
    public RemoveTrustedResponse removeTrusted(
            Long userId,
            RemoveTrustedRequest request
    ) {
        User user = findUserById(userId);
        Contact contact = findContactByIdAndUserId(request.contactId(), userId);

        Boolean oldIsTrusted = contact.getIsTrusted(); // Captures old state for audit logging

        contact.setIsTrusted(false);
        contactRepository.save(contact);

        auditLogService.log(
                userId,
                Literals.CONTACT,
                Literals.REMOVE_TRUSTED_CONTACT,
                """
                {
                  "CONTACT_ID": %s,
                  "ALIAS": "%s",
                  "IDENTIFIER_TYPE": "%s",
                  "IDENTIFIER_VALUE": "%s",
                  "IS_TRUSTED": %s
                }
                """.formatted(
                        contact.getContactId(),
                        contact.getAlias(),
                        contact.getIdentifierType(),
                        contact.getIdentifierValue(),
                        oldIsTrusted
                ),
                """
                {
                  "CONTACT_ID": %s,
                  "ALIAS": "%s",
                  "IDENTIFIER_TYPE": "%s",
                  "IDENTIFIER_VALUE": "%s",
                  "IS_TRUSTED": %s
                }
                """.formatted(
                        contact.getContactId(),
                        contact.getAlias(),
                        contact.getIdentifierType(),
                        contact.getIdentifierValue(),
                        contact.getIsTrusted()
                )
        ); // Audit log for removing trusted status

        notificationService.notification(
                user,
                Literals.CONTACT_UNTRUSTED_MESSAGE.formatted(contact.getAlias()),
                NotificationStatus.UNREAD
        );

        return new RemoveTrustedResponse(
                contact.getContactId(),
                contact.getIsTrusted()
        );
    }

    private User findUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(Literals.USER_RESOURCE, userId)); // Fetches user by id
    }

    private Contact findContactByIdAndUserId(
            Long contactId,
            Long userId
    ) {
        return contactRepository.findByContactIdAndUser_UserId(contactId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(Literals.CONTACT_RESOURCE, contactId)); // Fetches contact owned by the user
    }
}