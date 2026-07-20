package com.endava.cashflash.constants;

public final class ApiPaths {

    private ApiPaths() {}

    // Api base
    public static final String API_BASE = "/api";
    public static final String API_WILDCARD = API_BASE + "/**";

    // Auth User base
    public static final String AUTH_USER_BASE = API_BASE + "/auth-user";
    // Auth User endpoints
    public static final String AUTH_USER_LOG_IN = AUTH_USER_BASE + "/log-in";
    public static final String AUTH_USER_GET_OTP = AUTH_USER_BASE + "/get-otp";
    public static final String AUTH_USER_VERIFY_OTP = AUTH_USER_BASE + "/verify-otp";
    public static final String AUTH_USER_RESET_PASSWORD = AUTH_USER_BASE + "/reset-password";

    // Auth User endpoints
    public static final String LOG_IN = "/log-in";
    public static final String GET_OTP = "/get-otp";
    public static final String VERIFY_OTP = "/verify-otp";
    public static final String RESET_PASSWORD = "/reset-password";
    public static final String SET_PIN = "/set-pin";
    public static final String VERIFY_PIN = "/verify-pin";

    // Admin base
    public static final String ADMIN_BASE = API_BASE + "/admin";
    // Admin endpoints
    public static final String ADMIN_TRANSACTIONS_ALL = "/all";
    public static final String ADMIN_STATS = "/stats";
    public static final String ADMIN_USER_DEACTIVATE = "/user-deactivate";
    public static final String ADMIN_USER_ACTIVATE = "/user-activate";
    public static final String ADMIN_ALL_USERS = "/all-users";
    public static final String ADMIN_KYC_UPGRADE_PENDING = "/kyc-upgrade/pending";
    public static final String ADMIN_KYC_UPGRADE_REVIEW = "/kyc-upgrade/review";
    public static final String ADMIN_KYC_UPGRADE_DOCUMENT = "/kyc-upgrade/document";

    // PSP base
    public static final String PSP_BANK_ACCOUNT_BASE = API_BASE + "/bank-account-psp";
    public static final String PSP_CARD_BASE = API_BASE + "/card-psp";
    // PSP endpoints
    public static final String PSP_BANK_ACCOUNT_VERIFY = PSP_BANK_ACCOUNT_BASE + "/verify";
    public static final String PSP_BANK_ACCOUNT_DEBIT = PSP_BANK_ACCOUNT_BASE + "/debit";
    public static final String PSP_BANK_ACCOUNT_CREDIT = PSP_BANK_ACCOUNT_BASE + "/credit";
    public static final String PSP_BANK_ACCOUNT_BALANCE = PSP_BANK_ACCOUNT_BASE + "/balance";
    public static final String PSP_CARD_VERIFY = PSP_CARD_BASE + "/verify";
    public static final String PSP_CARD_DEBIT = PSP_CARD_BASE + "/debit";
    public static final String PSP_CARD_CREDIT = PSP_CARD_BASE + "/credit";
    //public static final String PSP_CARD_BALANCE = PSP_CARD_BASE + "/balance";

    // User base
    public static final String USER_BASE = API_BASE + "/user";
    // User endpoints
    public static final String SIGN_UP = "/sign-up";
    public static final String USER_SIGN_UP = USER_BASE + "/sign-up";
    public static final String USER_PAYMENT_METHODS = "/payment-methods";
    public static final String USER_PROFILE_PICTURE = "/set-profile-picture";
    public static final String USER_KYC_UPGRADE = "/kyc-upgrade";
    public static final String USER_KYC_UPGRADE_STATUS = "/kyc-upgrade/status";
    public static final String USER_KYC_UPGRADE_DOCUMENT = "/kyc-upgrade/document";

    // Merchant base
    public static final String MERCHANT_BASE = API_BASE + "/merchant";
    // Merchant endpoints
    public static final String MERCHANT_UPGRADE = "/merchant-upgrade";

    // Wallet base
    public static final String WALLET_BASE = API_BASE + "/wallet";
    // Wallet endpoints
    public static final String WALLET_DETAILS = "/details";

    // Bank Account base
    public static final String BANK_ACCOUNT_BASE = API_BASE + "/bank-account";
    // Bank Account endpoints
    public static final String BANK_ACCOUNT_ADD = "/add";
    public static final String BANK_ACCOUNT_BALANCE = "/balance";

    // Card base
    public static final String CARD_BASE = API_BASE + "/card";
    // Card endpoints
    public static final String CARD_ADD = "/add";

    // Transaction base
    public static final String TRANSACTION_BASE = API_BASE + "/transaction";
    // Transaction endpoints
    public static final String TRANSACTION_USER = "/user";
    public static final String TRANSACTION_LAST = "/last";
    public static final String TRANSACTION_TOP_UP = "/top-up";
    public static final String TRANSACTION_WITHDRAW = "/withdraw";
    public static final String TRANSACTION_SEND = "/send";

    // Payment methods base
    public static final String PAYMENT_METHOD_BASE = API_BASE + "/payment-methods";
    // Payment methods endpoints
    public static final String PAYMENT_METHOD_SET_DEFAULT = "/set-default";
    public static final String PAYMENT_METHOD_ACTIVATE = "/activate";
    public static final String PAYMENT_METHOD_DEACTIVATE = "/deactivate";

    // Payment request base
    public static final String PAYMENT_REQUEST_BASE = API_BASE + "/payment-request";
    // Payment request endpoints
    public static final String PAYMENT_REQUEST_SEND = "/send";
    public static final String PAYMENT_REQUEST_RESPOND = "/respond";
    public static final String PAYMENT_REQUEST_CANCEL = "/cancel";
    public static final String PAYMENT_REQUEST_ALL = "/all";

    // Notification base
    public static final String NOTIFICATION_BASE = API_BASE + "/notification";
    // Notification endpoints
    public static final String NOTIFICATION_USER = "/user";
    public static final String NOTIFICATION_READ = "/read";

    // Contact base
    public static final String CONTACT_BASE = API_BASE + "/contact";
    // Contact endpoints
    public static final String CONTACT_USER = "/user";
    public static final String CONTACT_ADD = "/add";
    public static final String CONTACT_SET_TRUSTED = "/set-trusted";
    public static final String CONTACT_REMOVE_TRUSTED = "/remove-trusted";

    // File base
    public static final String FILE_BASE = "/files";
    // File endpoints
    public static final String FILE_PROFILE = FILE_BASE + "/profile/**";

    // WebSocket endpoints and prefixes
    public static final String WEBSOCKET_ENDPOINT = "/websocket";
    public static final String WEBSOCKET = WEBSOCKET_ENDPOINT + "/**";
    public static final String WEBSOCKET_APP_PREFIX = "/app";
    public static final String WEBSOCKET_USER_PREFIX = "/user";
    public static final String WEBSOCKET_TOPIC_PREFIX = "/topic";
    public static final String WEBSOCKET_QUEUE_PREFIX = "/queue";

    // Permit endpoints
    public static final String PROFILE_FILES = FILE_PROFILE;
    public static final String ACTUATOR = "/actuator/**";
    public static final String METRICS_DEMO = "/api/metrics-demo/**";
    public static final String ADMIN = "/api/admin/**";
}