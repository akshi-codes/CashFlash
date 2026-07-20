package com.endava.cashflash.exception;

public class InvalidTransactionDirectionException extends CustomException {

    public InvalidTransactionDirectionException(String message) {
        super("INVALID_TRANSACTION_DIRECTION", message);
    }
}
