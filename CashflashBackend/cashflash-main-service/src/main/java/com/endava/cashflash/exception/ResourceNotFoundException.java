package com.endava.cashflash.exception;

// Signals that a requested entity could not be found.
public class ResourceNotFoundException extends CustomException {

    public ResourceNotFoundException(String resource, Long id) {
        super(
                "RESOURCE_NOT_FOUND",
                resource + " not found with ID: " + id
        );
    }
}

