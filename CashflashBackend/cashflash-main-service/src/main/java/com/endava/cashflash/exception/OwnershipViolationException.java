package com.endava.cashflash.exception;

// Signals that a user tried to access a resource they do not own.
public class OwnershipViolationException extends CustomException {

    public OwnershipViolationException(String message) {
        super("OWNERSHIP_VIOLATION", message);
    }
}
