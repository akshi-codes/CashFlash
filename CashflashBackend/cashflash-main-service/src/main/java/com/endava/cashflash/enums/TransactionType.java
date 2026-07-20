package com.endava.cashflash.enums;

import lombok.Getter;

@Getter
public enum TransactionType {

    USER_WALLET_TO_USER_BANK("User Wallet → User Bank"),
    USER_BANK_TO_USER_BANK("User Bank → User Bank"),
    USER_CARD_TO_USER_BANK("User Card → User Bank"),
    USER_BANK_TO_SELF_WALLET("User Bank → Self Wallet"),
    USER_WALLET_TO_SELF_BANK("User Wallet → Self Bank"),
    USER_WALLET_TO_MERCHANT_BANK("User Wallet → Merchant Bank"),
    USER_BANK_TO_MERCHANT_BANK("User Bank → Merchant Bank"),
    USER_CARD_TO_MERCHANT_BANK("User Card → Merchant Bank"),
    MERCHANT_BANK_TO_USER_BANK("Merchant Bank → User Bank");

    private final String label;

    TransactionType(String label) {
        this.label = label;
    }
}
