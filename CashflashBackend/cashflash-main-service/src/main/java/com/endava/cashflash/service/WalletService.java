package com.endava.cashflash.service;

import com.endava.cashflash.dto.response.WalletDetailsResponse;

// Defines wallet detail retrieval operations.
public interface WalletService {
    WalletDetailsResponse getWalletDetails(Long userId);
}
