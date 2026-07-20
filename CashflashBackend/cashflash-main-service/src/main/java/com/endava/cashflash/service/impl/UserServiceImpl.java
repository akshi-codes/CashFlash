package com.endava.cashflash.service.impl;

import com.endava.cashflash.constants.CacheNames;
import com.endava.cashflash.constants.Literals;
import com.endava.cashflash.dto.internal.BankAccountResponse;
import com.endava.cashflash.dto.internal.CardResponse;
import com.endava.cashflash.dto.internal.WalletResponse;
import com.endava.cashflash.dto.request.SignUpRequest;
import com.endava.cashflash.dto.response.SignUpResponse;
import com.endava.cashflash.dto.response.UserPaymentMethodsResponse;
import com.endava.cashflash.enums.NotificationStatus;
import com.endava.cashflash.exception.ResourceAlreadyExistsException;
import com.endava.cashflash.exception.ResourceNotFoundException;
import com.endava.cashflash.model.AuthUser;
import com.endava.cashflash.model.User;
import com.endava.cashflash.model.Wallet;
import com.endava.cashflash.repository.UserRepository;
import com.endava.cashflash.service.AuditLogService;
import com.endava.cashflash.service.NotificationService;
import com.endava.cashflash.service.UserService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;
    private final ProfilePictureStorageService storageService;

    @Value("${app.upload.profile.public-base}")
    private String publicBase;

    /**
     * Registers a new user after validating email and phone number.
     * @param request signup request containing user details and password
     * @return signup response containing created user details
     * @throws ResourceAlreadyExistsException when email or phone number already exists
     */
    @Override
    @Transactional
    public SignUpResponse signUp(SignUpRequest request) {

        // Checks if email is already registered
        if (userRepository.existsByEmail(request.email()) > 0) {
            throw new ResourceAlreadyExistsException(request.email()); // Throws if email already exists
        }

        // Checks if phone number is already registered
        if (userRepository.existsByPhoneNumber(request.phoneNumber()) > 0) {
            throw new ResourceAlreadyExistsException(request.phoneNumber()); // Throws if phone number already exists
        }

        // Stores hashed password value to be saved
        String hashedPassword = passwordEncoder.encode(request.password());

        // Stores generated payment ID to be saved
        String paymentId = request.phoneNumber() + "@cashflash";

        // Stores generated QR URL to be saved
        String qrcodeUrl = "https://qrurl/" + paymentId + "size";

        // Create new user
        User user = new User();
        user.setFullName(request.fullName());
        user.setEmail(request.email().trim().toLowerCase());
        user.setPhoneNumber(request.phoneNumber().trim());
        user.setPaymentId(paymentId);
        user.setQrcodeUrl(qrcodeUrl);

        // Update AuthUser
        AuthUser authUser = new AuthUser();
        authUser.setPasswordHash(hashedPassword);

        Wallet wallet = new Wallet();

        // Save on either side
        authUser.setUser(user);
        wallet.setUser(user);
        user.setAuthUser(authUser);
        user.setWallet(wallet);

        // Save in repository
        userRepository.save(user); // cascade saves authUser too

        // Audit log
        auditLogService.log(
                user.getUserId(),
                Literals.USER,
                "SIGN-UP",
                null,
                """
                {
                  "USER_ID": %s,
                  "FULL_NAME": "%s",
                  "EMAIL": "%s",
                  "PHONE_NUMBER": "%s",
                  "PAYMENT_ID": "%s",
                  "STATUS": "%s"
                }
                """.formatted(
                        user.getUserId(),
                        user.getFullName(),
                        user.getEmail(),
                        user.getPhoneNumber(),
                        user.getPaymentId(),
                        "SUCCESSFUL"
                )
        );

        notificationService.notification(
                user,
                "Welcome to CashFlash. Your account was created successfully.",
                NotificationStatus.UNREAD
        );

        // Returns response DTO for created user
        return new SignUpResponse(
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhoneNumber()
        );
    }

    @Override
    @Cacheable(cacheNames = CacheNames.PAYMENT_METHODS_BY_USER, key = "#userId")
    public UserPaymentMethodsResponse getUserPaymentMethods(Long userId) {

        User user = userRepository.findUserWithPaymentMethods(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        WalletResponse wallet = user.getWallet() == null ? null :
                new WalletResponse(
                        user.getWallet().getWalletId(),
                        user.getWallet().getBalance(),
                        user.getWallet().getFlashPotBalance(),
                        user.getWallet().getUpdatedAt(),
                        user.getWallet().getIsActive(),
                        user.getWallet().getIsFrozen()
                );

        List<BankAccountResponse> bankAccounts = user.getBankAccounts().stream()
                .map(bankAccount -> new BankAccountResponse(
                        bankAccount.getBankAccountId(),
                        bankAccount.getLast4(),
                        bankAccount.getBankName(),
                        bankAccount.getIfsc(),
                        bankAccount.getIsDefault(),
                        bankAccount.getIsActive()
                )).toList();

        List<CardResponse> cards = user.getCards().stream()
                .map(card -> new CardResponse(
                        card.getCardId(),
                        card.getLast4(),
                        card.getProvider(),
                        card.getType(),
                        card.getExpiryMonth(),
                        card.getExpiryYear(),
                        card.getIsDefault(),
                        card.getIsActive()
                )).toList();

        return new UserPaymentMethodsResponse(wallet, bankAccounts, cards);
    }

    @Override
    @Transactional
    public String setProfilePicture(Long userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Profile picture file is required");
        }

        String contentType = file.getContentType();
        if (contentType == null || !(contentType.equals("image/jpeg") || contentType.equals("image/png") || contentType.equals("image/webp"))) {
            throw new IllegalArgumentException("Only JPG, PNG, WEBP images are allowed");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        String oldProfileImageUrl = user.getProfileImageUrl();

        String filename = storageService.storeProfilePicture(userId, file); // returns only filename
        String url = publicBase + "/" + userId + "/" + filename;

        user.setProfileImageUrl(url);
        userRepository.save(user);

        auditLogService.log(
                user.getUserId(),
                Literals.USER,
                "UPDATE-PROFILE-PICTURE",
                """
                {
                  "PROFILE_IMAGE_URL": "%s"
                }
                """.formatted(oldProfileImageUrl),
                """
                {
                  "PROFILE_IMAGE_URL": "%s"
                }
                """.formatted(user.getProfileImageUrl())
        );

        notificationService.notification(
                user,
                "Your profile picture was updated successfully.",
                NotificationStatus.UNREAD
        );

        return url;
    }
}