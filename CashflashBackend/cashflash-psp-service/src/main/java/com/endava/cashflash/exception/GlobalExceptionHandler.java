package com.endava.cashflash.exception;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;

@Slf4j
@RestControllerAdvice
// Maps PSP exceptions to consistent API error responses.
public class GlobalExceptionHandler {

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ErrorResponse> handleCustomException(CustomException exception) {

        ErrorResponse response = new ErrorResponse(
                exception.getErrorCode(),
                exception.getMessage(),
                Instant.now()
        );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(MethodArgumentNotValidException exception) {

        String message = "Validation failed";

        FieldError fieldError = exception.getBindingResult().getFieldError();
        if (fieldError != null) {
            message = "Invalid value for: " + fieldError.getField();
        }

        ErrorResponse response = new ErrorResponse(
                "VALIDATION_ERROR",
                message,
                Instant.now()
        );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

    @ExceptionHandler(BindException.class)
    public ResponseEntity<ErrorResponse> handleBindException(BindException exception) {

        String message = "Validation failed";

        FieldError fieldError = exception.getBindingResult().getFieldError();
        if (fieldError != null) {
            message = "Invalid value for: " + fieldError.getField();
        }

        ErrorResponse response = new ErrorResponse(
                "VALIDATION_ERROR",
                message,
                Instant.now()
        );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(ConstraintViolationException exception) {

        String message = "Validation failed";

        ConstraintViolation<?> violation = exception.getConstraintViolations().stream().findFirst().orElse(null);
        if (violation != null && violation.getPropertyPath() != null) {
            message = "Invalid value for: " + violation.getPropertyPath();
        }

        ErrorResponse response = new ErrorResponse(
                "VALIDATION_ERROR",
                message,
                Instant.now()
        );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(DataIntegrityViolationException exception) {

        ErrorResponse response = new ErrorResponse(
                "INVALID_DATA",
                "Request violates data constraints",
                Instant.now()
        );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(HttpMessageNotReadableException exception) {

        ErrorResponse response = new ErrorResponse(
                "BAD_REQUEST",
                "Invalid request body",
                Instant.now()
        );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException exception) {

        ErrorResponse response = new ErrorResponse(
                "BAD_REQUEST",
                exception.getMessage(),
                Instant.now()
        );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalState(IllegalStateException exception) {

        ErrorResponse response = new ErrorResponse(
                "INVALID_STATE",
                exception.getMessage(),
                Instant.now()
        );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntime(RuntimeException exception) {

        log.error("Unhandled runtime exception occurred", exception);

        ErrorResponse response = new ErrorResponse(
                "INTERNAL_ERROR",
                "Something went wrong",
                Instant.now()
        );

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception exception) {

        log.error("Unhandled exception occurred", exception);

        ErrorResponse response = new ErrorResponse(
                "INTERNAL_ERROR",
                "Something went wrong",
                Instant.now()
        );

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(response);
    }
}
