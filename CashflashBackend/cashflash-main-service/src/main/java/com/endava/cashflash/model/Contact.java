package com.endava.cashflash.model;

import com.endava.cashflash.enums.IdentifierType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "contacts")
public class Contact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "contact_id")
    private Long contactId; // Primary key

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user; // User who owns this contact

    @Column(name = "alias", nullable = false, length = 64)
    private String alias; // Display name for the contact

    @Enumerated(EnumType.STRING)
    @Column(name = "identifier_type", nullable = false, length = 32)
    private IdentifierType identifierType; // Type of identifier used for the contact

    @Column(name = "identifier_value", nullable = false, length = 128)
    private String identifierValue; // Actual identifier value of the contact

    @Column(name = "is_trusted", nullable = false)
    private Boolean isTrusted = Boolean.FALSE; // Indicates whether the contact is trusted
}