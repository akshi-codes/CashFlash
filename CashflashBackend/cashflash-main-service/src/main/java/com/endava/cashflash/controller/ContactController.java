package com.endava.cashflash.controller;

import com.endava.cashflash.constants.ApiPaths;
import com.endava.cashflash.dto.request.AddContactRequest;
import com.endava.cashflash.dto.request.RemoveTrustedRequest;
import com.endava.cashflash.dto.request.SetTrustedRequest;
import com.endava.cashflash.dto.response.AddContactResponse;
import com.endava.cashflash.dto.response.RemoveTrustedResponse;
import com.endava.cashflash.dto.response.SetTrustedResponse;
import com.endava.cashflash.model.Contact;
import com.endava.cashflash.security.AuthPrincipal;
import com.endava.cashflash.service.ContactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping(ApiPaths.CONTACT_BASE)
// Exposes contact management endpoints for authenticated users.
public class ContactController {

    private final ContactService contactService;

    @GetMapping(ApiPaths.CONTACT_USER)
    public List<Contact> allContacts(
            @AuthenticationPrincipal AuthPrincipal principal
    ) {
        return contactService.getAllContacts(principal.getUserId());
    }

    @PostMapping(ApiPaths.CONTACT_ADD)
    public AddContactResponse addContact(
            @AuthenticationPrincipal AuthPrincipal principal,
            @Valid @RequestBody AddContactRequest request
    ) {
        return contactService.addContact(principal.getUserId(), request);
    }

    @PutMapping(ApiPaths.CONTACT_SET_TRUSTED)
    public SetTrustedResponse setTrusted(
            @AuthenticationPrincipal AuthPrincipal principal,
            @Valid @RequestBody SetTrustedRequest request
    ) {
        return contactService.setTrusted(principal.getUserId(), request);
    }

    @PutMapping(ApiPaths.CONTACT_REMOVE_TRUSTED)
    public RemoveTrustedResponse removeTrusted(
            @AuthenticationPrincipal AuthPrincipal principal,
            @Valid @RequestBody RemoveTrustedRequest request
    ) {
        return contactService.removeTrusted(principal.getUserId(), request);
    }
}
