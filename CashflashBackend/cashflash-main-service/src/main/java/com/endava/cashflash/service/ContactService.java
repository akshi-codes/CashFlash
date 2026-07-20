package com.endava.cashflash.service;

import com.endava.cashflash.dto.request.AddContactRequest;
import com.endava.cashflash.dto.request.RemoveTrustedRequest;
import com.endava.cashflash.dto.request.SetTrustedRequest;
import com.endava.cashflash.dto.response.AddContactResponse;
import com.endava.cashflash.dto.response.RemoveTrustedResponse;
import com.endava.cashflash.dto.response.SetTrustedResponse;
import com.endava.cashflash.model.Contact;

import java.util.List;

// Defines contact-management operations for user address books.
public interface ContactService {
    List<Contact> getAllContacts(Long userId);
    AddContactResponse addContact(Long userId, AddContactRequest request);
    SetTrustedResponse setTrusted(Long userId, SetTrustedRequest request);
    RemoveTrustedResponse removeTrusted(Long userId, RemoveTrustedRequest request);
}
