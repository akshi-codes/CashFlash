package com.endava.cashflash.service;

import com.endava.cashflash.dto.internal.LastTransactionDto;
import com.endava.cashflash.dto.internal.UserTransactionResponseDto;
import com.endava.cashflash.dto.request.SendMoneyRequest;
import com.endava.cashflash.dto.request.WalletTopUpRequest;
import com.endava.cashflash.dto.request.WalletWithdrawRequest;
import com.endava.cashflash.dto.response.AllTransactionResponseDto;
import com.endava.cashflash.dto.response.TransactionResultResponse;

import java.util.List;

// Defines transaction history and money-movement operations.
public interface TransactionService {

    List<UserTransactionResponseDto> getUserTransactions(Long userId);

    List<AllTransactionResponseDto> getAllTransactions();

    LastTransactionDto getLastTransaction(Long userId);

   TransactionResultResponse topUpWalletFromBankAccount(
            Long userId,
            WalletTopUpRequest request,
            String authorization,
            String idempotencyKey
    );

   TransactionResultResponse withdrawWalletToBankAccount(
           Long userId,
           WalletWithdrawRequest request,
           String authorization,
           String idempotencyKey
   );

    TransactionResultResponse sendMoney(
            Long userId,
            SendMoneyRequest request,
            String authorization,
            String idempotencyKey
    );
}
