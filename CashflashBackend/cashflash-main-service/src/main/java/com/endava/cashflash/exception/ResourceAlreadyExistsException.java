package com.endava.cashflash.exception;

public class ResourceAlreadyExistsException extends CustomException {

    public ResourceAlreadyExistsException(String resource) {
        super(
                "RESOURCE__EXISTS", // Error code for duplicate resource
                resource +  " already exists" // Readable error message
        );
    }
}
