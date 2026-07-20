package com.endava.cashflash.enums;

import lombok.Getter;

@Getter
public enum MerchantCategory {
    FOOD_AND_BEVERAGES("Food & Beverages"),
    GROCERY("Grocery"),
    ELECTRONICS("Electronics"),
    FASHION_AND_APPAREL("Fashion & Apparel"),
    HEALTHCARE("Healthcare"),
    PHARMACY("Pharmacy"),
    TRAVEL_AND_TRANSPORT("Travel & Transport"),
    ENTERTAINMENT("Entertainment"),
    BEAUTY_AND_WELLNESS("Beauty & Wellness"),
    SERVICES("Services"),
    OTHERS("Others");

    private final String label;

    MerchantCategory(String label) {
        this.label = label;
    }

}

