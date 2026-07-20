package com.endava.cashflash.constants;

public final class Literals {

    private Literals() {
    }

    // Roles
    public static final String ADMIN = "ADMIN";
    public static final String USER = "USER";
    public static final String MERCHANT = "MERCHANT";

    // Other entities
    public static final String TRANSACTION = "TRANSACTION";
    public static final String AUTH_USER = "AUTH_USER";
    public static final String BANK_ACCOUNT = "BANK_ACCOUNT";
    public static final String CARD = "CARD";
    public static final String CONTACT = "CONTACT";

    // Actions
    public static final String LOG_IN = "LOG-IN";
    public static final String VERIFY_PIN = "VERIFY-PIN";
    public static final String SET_PIN = "SET-PIN";
    public static final String GET_OTP = "GET-OTP";
    public static final String VERIFY_OTP = "VERIFY-OTP";
    public static final String RESET_PASSWORD = "RESET-PASSWORD";
    public static final String ACTIVATE_USER = "ACTIVATE-USER";
    public static final String DEACTIVATE_USER = "DEACTIVATE-USER";
    public static final String ADD_BANK_ACCOUNT = "ADD-BANK-ACCOUNT";
    public static final String CHANGE_DEFAULT_BANK_ACCOUNT = "CHANGE_DEFAULT_BANK_ACCOUNT";
    public static final String DEACTIVATE_BANK_ACCOUNT = "DEACTIVATE_BANK_ACCOUNT";
    public static final String ACTIVATE_BANK_ACCOUNT = "ACTIVATE_BANK_ACCOUNT";
    public static final String ADD_CARD = "ADD-CARD";
    public static final String CHANGE_DEFAULT_CARD = "CHANGE_DEFAULT_CARD";
    public static final String DEACTIVATE_CARD = "DEACTIVATE_CARD";
    public static final String ACTIVATE_CARD = "ACTIVATE_CARD";
    public static final String ADD_CONTACT = "ADD-CONTACT";
    public static final String SET_TRUSTED_CONTACT = "SET-TRUSTED-CONTACT";
    public static final String REMOVE_TRUSTED_CONTACT = "REMOVE-TRUSTED-CONTACT";

    // Status
    public static final String SUCCESSFUL = "SUCCESSFUL";
    public static final String FAILED = "FAILED";
    public static final String LOCKED = "LOCKED";

    // Common fields
    public static final String CREATED_AT = "createdAt";
    public static final String AREA = "area";
    public static final String STATUS_TAG = "status";

    // Resource names
    public static final String ADMIN_RESOURCE = "Admin";
    public static final String USER_RESOURCE = "User";
    public static final String BANK_ACCOUNT_RESOURCE = "Bank account";
    public static final String BANK_ACCOUNT_RESOURCE_COMPACT = "BankAccount";
    public static final String CARD_RESOURCE = "Card";
    public static final String CONTACT_RESOURCE = "Contact";

    // Metric names
    public static final String JVM_MEMORY_USED = "jvm.memory.used";
    public static final String JVM_MEMORY_MAX = "jvm.memory.max";
    public static final String JVM_THREADS_LIVE = "jvm.threads.live";
    public static final String PROCESS_CPU_USAGE = "process.cpu.usage";
    public static final String SYSTEM_CPU_USAGE = "system.cpu.usage";
    public static final String HTTP_SERVER_REQUESTS = "http.server.requests";
    public static final String HEAP = "heap";
    public static final String NONHEAP = "nonheap";

    // Validation / ownership messages
    public static final String BANK_ACCOUNT_OWNERSHIP_MESSAGE = "Bank account does not belong to user";
    public static final String INACTIVE_BANK_ACCOUNT_DEFAULT_MESSAGE = "Inactive bank account cannot be set as default";
    public static final String CARD_OWNERSHIP_MESSAGE = "Card does not belong to user";
    public static final String USER_INACTIVE_MESSAGE = "User is inactive";
    public static final String KYC_UPGRADE_ALREADY_PENDING_MESSAGE = "KYC upgrade already pending";
    public static final String KYC_ALREADY_APPROVED_MESSAGE = "KYC already approved";
    public static final String KYC_DOCUMENT_NOT_FOUND_MESSAGE = "KYC document not found";
    public static final String KYC_DOCUMENT_NOT_READABLE_MESSAGE = "KYC document not readable";
    public static final String KYC_UPGRADE_NOT_PENDING_MESSAGE = "KYC upgrade is not pending";
    public static final String KYC_REVIEW_STATUS_INVALID_MESSAGE = "Only APPROVED or REJECTED is allowed";
    public static final String PDF_FILE_REQUIRED_MESSAGE = "PDF file is required";
    public static final String ONLY_PDF_ALLOWED_MESSAGE = "Only PDF files are allowed";
    public static final String KYC_PDF_STORE_FAILED_MESSAGE = "Failed to store KYC PDF";

    // File values
    public static final String PDF_EXTENSION = ".pdf";
    public static final String KYC_FILE_PREFIX = "kyc_";

    // Notifications
    public static final String ACCOUNT_ACTIVATED_BY_ADMIN_MESSAGE =
            "Your CashFlash account has been activated by admin.";
    public static final String ACCOUNT_DEACTIVATED_BY_ADMIN_MESSAGE =
            "Your CashFlash account has been deactivated by admin.";
    public static final String BANK_ACCOUNT_ADDED_MESSAGE =
            "Your bank account ending with %s was added successfully.";
    public static final String BANK_ACCOUNT_DEFAULT_MESSAGE =
            "Your bank account ending with %s is now set as default.";
    public static final String BANK_ACCOUNT_DEACTIVATED_MESSAGE =
            "Your bank account ending with %s was deactivated successfully.";
    public static final String BANK_ACCOUNT_ACTIVATED_MESSAGE =
            "Your bank account ending with %s was activated successfully.";
    public static final String CARD_ADDED_MESSAGE =
            "Your card ending with %s was added successfully.";
    public static final String CARD_DEFAULT_MESSAGE =
            "Your card ending with %s is now set as default.";
    public static final String CARD_DEACTIVATED_MESSAGE =
            "Your card ending with %s was deactivated successfully.";
    public static final String CARD_ACTIVATED_MESSAGE =
            "Your card ending with %s was activated successfully.";
    public static final String CONTACT_ADDED_MESSAGE =
            "%s was added successfully.";
    public static final String CONTACT_TRUSTED_MESSAGE =
            "%s was marked as trusted.";
    public static final String CONTACT_UNTRUSTED_MESSAGE =
            "%s was removed from trusted contacts.";

    // JSON Blocks
    public static final String STATUS = """
            {
              "STATUS": "%s"
            }
            """;

    public static final String AUTHORIZATION = "Authorization";
    public static final String IDEMPOTENCY_KEY = "Idempotency-Key";
}