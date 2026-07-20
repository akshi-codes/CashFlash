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
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

import java.time.Instant;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler { // Handles exceptions globally

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ErrorResponse> handleCustomException(CustomException customException) {
        return ResponseEntity
                .status(resolveStatus(customException))
                .body(buildErrorResponse(customException.getErrorCode(), customException.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(MethodArgumentNotValidException exception) {

        String message = "Validation failed";

        FieldError fieldError = exception.getBindingResult().getFieldError();
        if (fieldError != null) {
            message = fieldError.getDefaultMessage() != null
                    ? fieldError.getDefaultMessage()
                    : "Invalid value for: " + fieldError.getField();
        }

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(buildErrorResponse("VALIDATION_ERROR", message));
    }

    @ExceptionHandler(BindException.class)
    public ResponseEntity<ErrorResponse> handleBindException(BindException exception) {

        String message = "Validation failed";

        FieldError fieldError = exception.getBindingResult().getFieldError();
        if (fieldError != null) {
            message = fieldError.getDefaultMessage() != null
                    ? fieldError.getDefaultMessage()
                    : "Invalid value for: " + fieldError.getField();
        }

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(buildErrorResponse("VALIDATION_ERROR", message));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(ConstraintViolationException exception) {

        String message = "Validation failed";

        ConstraintViolation<?> violation = exception.getConstraintViolations().stream().findFirst().orElse(null);
        if (violation != null) {
            message = violation.getMessage();
        }

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(buildErrorResponse("VALIDATION_ERROR", message));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation() {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(buildErrorResponse("INVALID_DATA", "Request violates data constraints"));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(HttpMessageNotReadableException exception) {

        Throwable cause = exception;
        while (cause.getCause() != null) {
            cause = cause.getCause();
        }

        if (cause instanceof CustomException customException) {
            return ResponseEntity
                    .status(resolveStatus(customException))
                    .body(buildErrorResponse(customException.getErrorCode(), customException.getMessage()));
        }

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(buildErrorResponse("BAD_REQUEST", "Invalid request body"));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSizeExceeded() {
        return ResponseEntity
                .status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(buildErrorResponse("INVALID_FILE", "File size exceeds maximum allowed limit of 5MB"));
    }

    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<ErrorResponse> handleMultipartException() {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(buildErrorResponse("INVALID_MULTIPART_REQUEST", "Invalid multipart request"));
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<ErrorResponse> handleMissingServletRequestPart(MissingServletRequestPartException exception) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(buildErrorResponse("MISSING_FILE_PART", "Required file part is missing: " + exception.getRequestPartName()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException exception) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(buildErrorResponse("BAD_REQUEST", exception.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalState(IllegalStateException exception) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(buildErrorResponse("INVALID_STATE", exception.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception exception) {

        log.error("Unhandled exception occurred", exception);

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(buildErrorResponse("INTERNAL_ERROR", "Something went wrong"));
    }

    private ErrorResponse buildErrorResponse(String errorCode, String message) {
        return new ErrorResponse(errorCode, message, Instant.now());
    }

    private HttpStatus resolveStatus(CustomException exception) {
        if (exception instanceof InvalidCredentialsException) {
            return HttpStatus.UNAUTHORIZED;
        }

        if (exception instanceof OwnershipViolationException) {
            return HttpStatus.FORBIDDEN;
        }

        if (exception instanceof ResourceNotFoundException) {
            return HttpStatus.NOT_FOUND;
        }

        if (exception instanceof ResourceAlreadyExistsException
                || exception instanceof OtpAttemptsExceededException) {
            return HttpStatus.CONFLICT;
        }

        if (exception instanceof InvalidFieldException
                || exception instanceof InvalidOtpException
                || exception instanceof OtpExpiredException
                || exception instanceof OtpNotVerifiedException
                || exception instanceof NoOtpRequestedException
                || exception instanceof InsufficientBalanceException
                || exception instanceof InvalidTransactionDirectionException) {
            return HttpStatus.UNPROCESSABLE_ENTITY;
        }

        return HttpStatus.BAD_REQUEST;
    }
}
