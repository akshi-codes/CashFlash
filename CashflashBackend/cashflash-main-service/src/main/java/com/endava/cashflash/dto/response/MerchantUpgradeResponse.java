package com.endava.cashflash.dto.response;

import com.endava.cashflash.enums.MerchantCategory;

public record MerchantUpgradeResponse (Long merchantId, String businessName, MerchantCategory category, String gstin) {
}
