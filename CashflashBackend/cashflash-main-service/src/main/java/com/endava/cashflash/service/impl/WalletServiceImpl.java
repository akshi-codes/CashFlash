package com.endava.cashflash.service.impl;

import com.endava.cashflash.dto.response.WalletDetailsResponse;
import com.endava.cashflash.exception.ResourceNotFoundException;
import com.endava.cashflash.model.User;
import com.endava.cashflash.model.Wallet;
import com.endava.cashflash.repository.UserRepository;
import com.endava.cashflash.repository.WalletRepository;
import com.endava.cashflash.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
// Loads wallet details for the current user.
public class WalletServiceImpl implements WalletService {

    private final WalletRepository walletRepository;
    private final UserRepository userRepository;

    @Override
    public WalletDetailsResponse getWalletDetails(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Wallet wallet = walletRepository.findByUser_UserId(user.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", user.getUserId()));

        return new WalletDetailsResponse
        (
                wallet.getWalletId(),
                wallet.getBalance(),
                wallet.getFlashPotBalance(),
                wallet.getUpdatedAt(),
                wallet.getIsActive(),
                wallet.getIsFrozen()
        );
    }
}
