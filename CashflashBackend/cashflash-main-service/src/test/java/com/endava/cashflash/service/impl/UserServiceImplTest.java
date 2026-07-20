package com.endava.cashflash.service.impl;

import com.endava.cashflash.dto.internal.BankAccountResponse;
import com.endava.cashflash.dto.internal.CardResponse;
import com.endava.cashflash.dto.internal.WalletResponse;
import com.endava.cashflash.dto.request.SignUpRequest;
import com.endava.cashflash.dto.response.SignUpResponse;
import com.endava.cashflash.dto.response.UserPaymentMethodsResponse;
import com.endava.cashflash.enums.CardType;
import com.endava.cashflash.enums.NotificationStatus;
import com.endava.cashflash.enums.Provider;
import com.endava.cashflash.exception.ResourceAlreadyExistsException;
import com.endava.cashflash.exception.ResourceNotFoundException;
import com.endava.cashflash.model.BankAccount;
import com.endava.cashflash.model.Card;
import com.endava.cashflash.model.User;
import com.endava.cashflash.model.Wallet;
import com.endava.cashflash.repository.UserRepository;
import com.endava.cashflash.service.AuditLogService;
import com.endava.cashflash.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private ProfilePictureStorageService storageService;

    @InjectMocks
    private UserServiceImpl userService;

    @Test
    void getUserPaymentMethods_shouldReturnMappedResponse() {
        User user = new User();

        Wallet wallet = new Wallet();
        wallet.setWalletId(11L);
        wallet.setBalance(new BigDecimal("2500.00"));
        wallet.setFlashPotBalance(new BigDecimal("300.00"));
        wallet.setUpdatedAt(Instant.parse("2026-04-20T10:15:30Z"));
        wallet.setIsActive(true);
        wallet.setIsFrozen(false);

        BankAccount bankAccount = new BankAccount();
        bankAccount.setBankAccountId(21L);
        bankAccount.setLast4("6789");
        bankAccount.setBankName("HDFC");
        bankAccount.setIfsc("HDFC0001234");
        bankAccount.setIsDefault(true);
        bankAccount.setIsActive(true);

        Card card = new Card();
        card.setCardId(31L);
        card.setLast4("1234");
        card.setProvider(Provider.VISA);
        card.setType(CardType.CREDIT);
        card.setExpiryMonth("08");
        card.setExpiryYear("2030");
        card.setIsDefault(false);
        card.setIsActive(true);

        user.setWallet(wallet);
        user.setBankAccounts(Set.of(bankAccount));
        user.setCards(Set.of(card));

        when(userRepository.findUserWithPaymentMethods(101L)).thenReturn(Optional.of(user));

        UserPaymentMethodsResponse response = userService.getUserPaymentMethods(101L);

        assertNotNull(response);

        WalletResponse walletResponse = response.wallet();
        assertNotNull(walletResponse);
        assertEquals(11L, walletResponse.walletId());
        assertEquals(new BigDecimal("2500.00"), walletResponse.balance());

        BankAccountResponse bankAccountResponse = response.bankAccounts().getFirst();
        assertEquals("HDFC", bankAccountResponse.bankName());
        assertEquals("6789", bankAccountResponse.last4());

        CardResponse cardResponse = response.cards().getFirst();
        assertEquals(Provider.VISA, cardResponse.provider());
        assertEquals(CardType.CREDIT, cardResponse.type());

        verify(userRepository).findUserWithPaymentMethods(101L);
    }

    @Test
    void getUserPaymentMethods_shouldThrowWhenUserDoesNotExist() {
        when(userRepository.findUserWithPaymentMethods(101L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> userService.getUserPaymentMethods(101L));

        verify(userRepository).findUserWithPaymentMethods(101L);
    }

    @Test
    void signUp_shouldCreateUserSuccessfully() {
        SignUpRequest request = new SignUpRequest(
                "Akshay Maruti Shet",
                "  AKSHAY@MAIL.COM  ",
                "9876543210",
                "Password@123"
        );

        when(userRepository.existsByEmail("akshay@mail.com")).thenReturn(0);
        when(userRepository.existsByPhoneNumber("9876543210")).thenReturn(0);
        when(passwordEncoder.encode("Password@123")).thenReturn("encodedPassword123");

        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setUserId(101L);
            return user;
        });

        SignUpResponse response = userService.signUp(request);

        assertNotNull(response);
        assertEquals(101L, response.userId());
        assertEquals("Akshay Maruti Shet", response.fullName());
        assertEquals("akshay@mail.com", response.email());
        assertEquals("9876543210", response.phoneNumber());

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());

        User savedUser = userCaptor.getValue();
        assertEquals("Akshay Maruti Shet", savedUser.getFullName());
        assertEquals("akshay@mail.com", savedUser.getEmail());
        assertEquals("9876543210", savedUser.getPhoneNumber());
        assertEquals("9876543210@cashflash", savedUser.getPaymentId());
        assertEquals("https://qrurl/9876543210@cashflashsize", savedUser.getQrcodeUrl());

        assertNotNull(savedUser.getAuthUser());
        assertEquals("encodedPassword123", savedUser.getAuthUser().getPasswordHash());
        assertSame(savedUser, savedUser.getAuthUser().getUser());

        assertNotNull(savedUser.getWallet());
        assertSame(savedUser, savedUser.getWallet().getUser());

        verify(userRepository).existsByEmail("akshay@mail.com");
        verify(userRepository).existsByPhoneNumber("9876543210");
        verify(passwordEncoder).encode("Password@123");

        verify(auditLogService).log(
                eq(101L),
                eq("USER"),
                eq("SIGN-UP"),
                isNull(),
                contains("\"EMAIL\": \"akshay@mail.com\"")
        );

        verify(notificationService).notification(
                any(User.class),
                eq("Welcome to CashFlash. Your account was created successfully."),
                eq(NotificationStatus.UNREAD)
        );
    }

    @Test
    void signUp_shouldThrowExceptionWhenEmailAlreadyExists() {
        SignUpRequest request = new SignUpRequest(
                "Akshay Maruti Shet",
                "akshay@mail.com",
                "9876543210",
                "Password@123"
        );

        when(userRepository.existsByEmail("akshay@mail.com")).thenReturn(1);

        assertThrows(ResourceAlreadyExistsException.class, () -> userService.signUp(request));

        verify(userRepository).existsByEmail("akshay@mail.com");
        verify(userRepository, never()).existsByPhoneNumber(anyString());
        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any(User.class));
        verifyNoInteractions(auditLogService, notificationService);
    }

    @Test
    void signUp_shouldThrowExceptionWhenPhoneNumberAlreadyExists() {
        SignUpRequest request = new SignUpRequest(
                "Akshay Maruti Shet",
                "akshay@mail.com",
                "9876543210",
                "Password@123"
        );

        when(userRepository.existsByEmail("akshay@mail.com")).thenReturn(0);
        when(userRepository.existsByPhoneNumber("9876543210")).thenReturn(1);

        assertThrows(ResourceAlreadyExistsException.class, () -> userService.signUp(request));

        verify(userRepository).existsByEmail("akshay@mail.com");
        verify(userRepository).existsByPhoneNumber("9876543210");
        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any(User.class));
        verifyNoInteractions(auditLogService, notificationService);
    }

    @Test
    void signUp_shouldNotAuditOrNotifyWhenSaveFails() {
        SignUpRequest request = new SignUpRequest(
                "Akshay Maruti Shet",
                "akshay@mail.com",
                "9876543210",
                "Password@123"
        );

        when(userRepository.existsByEmail("akshay@mail.com")).thenReturn(0);
        when(userRepository.existsByPhoneNumber("9876543210")).thenReturn(0);
        when(passwordEncoder.encode("Password@123")).thenReturn("encodedPassword123");
        when(userRepository.save(any(User.class))).thenThrow(new RuntimeException("Database error"));

        assertThrows(RuntimeException.class, () -> userService.signUp(request));

        verify(userRepository).save(any(User.class));
        verify(auditLogService, never()).log(anyLong(), anyString(), anyString(), any(), anyString());
        verify(notificationService, never()).notification(any(), anyString(), any());
    }

    @Test
    void signUp_shouldUseNormalizedEmailForDuplicateCheck() {
        SignUpRequest request = new SignUpRequest(
                "Akshay Maruti Shet",
                "  AKSHAY@MAIL.COM  ",
                "9876543210",
                "Password@123"
        );

        when(userRepository.existsByEmail("akshay@mail.com")).thenReturn(1);

        assertThrows(ResourceAlreadyExistsException.class, () -> userService.signUp(request));

        verify(userRepository).existsByEmail("akshay@mail.com");
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void setProfilePicture_shouldUpdateUserAndReturnPublicUrl() {
        ReflectionTestUtils.setField(userService, "publicBase", "https://cdn.test/profile");

        User user = new User();
        user.setUserId(101L);
        user.setProfileImageUrl("https://cdn.test/profile/101/old.png");

        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn(MediaType.IMAGE_PNG_VALUE);
        when(userRepository.findById(101L)).thenReturn(Optional.of(user));
        when(storageService.storeProfilePicture(101L, file)).thenReturn("new.png");

        String url = userService.setProfilePicture(101L, file);

        assertEquals("https://cdn.test/profile/101/new.png", url);
        assertEquals(url, user.getProfileImageUrl());

        verify(userRepository).save(user);
        verify(auditLogService).log(
                eq(101L),
                eq("USER"),
                eq("UPDATE-PROFILE-PICTURE"),
                contains("old.png"),
                contains("new.png")
        );
        verify(notificationService).notification(
                eq(user),
                eq("Your profile picture was updated successfully."),
                eq(NotificationStatus.UNREAD)
        );
    }

    @Test
    void setProfilePicture_shouldThrowWhenFileIsMissing() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(true);

        IllegalArgumentException exception =
                assertThrows(IllegalArgumentException.class, () -> userService.setProfilePicture(101L, file));

        assertEquals("Profile picture file is required", exception.getMessage());
        verifyNoInteractions(storageService, auditLogService, notificationService);
    }

    @Test
    void setProfilePicture_shouldThrowWhenContentTypeIsUnsupported() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn(MediaType.APPLICATION_PDF_VALUE);

        IllegalArgumentException exception =
                assertThrows(IllegalArgumentException.class, () -> userService.setProfilePicture(101L, file));

        assertEquals("Only JPG, PNG, WEBP images are allowed", exception.getMessage());
        verifyNoInteractions(storageService, auditLogService, notificationService);
    }
}
