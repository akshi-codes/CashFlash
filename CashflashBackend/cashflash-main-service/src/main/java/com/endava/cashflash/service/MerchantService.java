package com.endava.cashflash.service;

import com.endava.cashflash.dto.request.MerchantUpgradeRequest;
import com.endava.cashflash.dto.response.MerchantUpgradeResponse;

public interface MerchantService {
    MerchantUpgradeResponse upgradeToMerchant(Long userId, MerchantUpgradeRequest request); // to upgrade from user to merchant
}
