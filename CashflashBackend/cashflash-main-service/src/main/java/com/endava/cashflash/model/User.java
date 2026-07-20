package com.endava.cashflash.model;

import com.endava.cashflash.enums.KycStatus;
import com.endava.cashflash.enums.UserRole;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId; // Primary key for user

    @NotBlank
    @Column(name = "full_name", nullable = false, length = 128)
    private String fullName; // User's full name

    @NotBlank
    @Email
    @Column(name = "email", nullable = false, unique = true, length = 128)
    private String email; // Unique email used to identify the user

    @NotBlank
    @Column(name = "phone_number", nullable = false, unique = true, length = 16)
    private String phoneNumber; // Unique phone number for the user

    @PastOrPresent
    @Column(name = "dob")
    private LocalDate dateOfBirth; // Date of birth, to verify KYC

    @Column(name = "profile_image_url", length = 512)
    private String profileImageUrl; // Profile picture of the user

    @Enumerated(EnumType.STRING)
    @Column(name = "kyc_status", nullable = false, length = 32)
    private KycStatus kycStatus = KycStatus.NOT_SUBMITTED; // Stores current KYC status

    @Column(name = "kyc_document_path", length = 512)
    private String kycDocumentPath; // Stored PDF file path

    @Column(name = "payment_id", length = 128)
    private String paymentId; // System-generated payment identifier for the user

    @Column(name = "qrcode_url", length = 512)
    private String qrcodeUrl; // System-generated QR code URL for payments

    @Column(name = "role", nullable = false)
    @Enumerated(EnumType.STRING)
    private UserRole role = UserRole.USER; // User role with default as USER

    @Column(name = "preferences_json", length = 1024)
    private String preferencesJson;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt; // Timestamp when the record was created

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt; // Timestamp when the record was last updated

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = Boolean.TRUE; // Indicates if the user account is active

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private AuthUser authUser; // Associated auth details for this user

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Wallet wallet;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Merchant merchant; // Associated merchant for this user

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @JsonIgnore
    private Set<BankAccount> bankAccounts;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @JsonIgnore
    private Set<Card> cards;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Notification> notifications = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Contact> contacts = new ArrayList<>();

    @Transient
    private Boolean loadedIsActive;

    @PostLoad
    private void postLoad() { // Capture original isActive value after entity is loaded
        this.loadedIsActive = this.isActive;
    }

    @PrePersist
    private void prePersist() { // On create
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        this.loadedIsActive = this.isActive;
    }

    @PreUpdate
    private void preUpdate() { // On update
        this.updatedAt = Instant.now();

        // propagate wallet soft-deactivate
        if (Boolean.TRUE.equals(this.loadedIsActive) && Boolean.FALSE.equals(this.isActive)) {
            propagateDeactivate();
        }

        this.loadedIsActive = this.isActive;
    }

    public void deactivate() {
        this.isActive = Boolean.FALSE;
        propagateDeactivate();
        this.loadedIsActive = Boolean.FALSE;
    }

    private void propagateDeactivate() {
        if (this.wallet != null) {
            this.wallet.setIsActive(false);
        }
    }

    public void activate() {
        this.isActive = Boolean.TRUE;
        propagateActivate();
        this.loadedIsActive = Boolean.TRUE;
    }

    private void propagateActivate() {
        if (this.wallet != null) {
            this.wallet.setIsActive(true);
        }
    }


}
