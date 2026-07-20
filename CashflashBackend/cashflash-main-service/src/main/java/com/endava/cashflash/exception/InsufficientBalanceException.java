package com.endava.cashflash.exception;

// Signals that a payment operation exceeded the available balance.
public class InsufficientBalanceException extends CustomException {

	public InsufficientBalanceException() {
        super(
            "INSUFFICIENT_BALANCE",
            "Balance is insufficient for this transaction"
        );
    }
}
