package com.endava.cashflash.constants;

public final class Queries {

    private Queries() {}

    // Reuses native SQL statements across repositories.
    public static final String COUNT_BY_ENTITY_NAME_AND_ACTION =
            "SELECT COUNT(*) " +
                    "FROM audit_logs al " +
                    "WHERE al.entity_name = :entityName " +
                    "AND al.action = :action";

    public static final String FIND_BY_USER_USERID =
            "SELECT au.* " +
                    "FROM auth_users au " +
                    "WHERE au.user_id = :userId";

    public static final String FIND_BY_USER_EMAIL =
            "SELECT au.* " +
                    "FROM auth_users au " +
                    "JOIN users u ON u.user_id = au.user_id " +
                    "WHERE u.email = :email";

    public static final String COUNT_BANK_ACCOUNTS_BY_USER_ID =
            "SELECT COUNT(*) " +
                    "FROM bank_accounts ba " +
                    "WHERE ba.user_id = :userId";

    public static final String CLEAR_DEFAULT_BANK_ACCOUNT_FOR_USER =
            "UPDATE bank_accounts " +
                    "SET is_default = false " +
                    "WHERE user_id = :userId";

    public static final String FIND_BANK_ACCOUNT_BY_ID_AND_USER_ID =
            "SELECT ba.* " +
                    "FROM bank_accounts ba " +
                    "WHERE ba.bank_account_id = :bankAccountId " +
                    "AND ba.user_id = :userId";

    public static final String FIND_DEFAULT_ACTIVE_BANK_ACCOUNT_BY_USER_ID =
            "SELECT ba.* " +
                    "FROM bank_accounts ba " +
                    "WHERE ba.user_id = :userId " +
                    "AND ba.is_default = true " +
                    "AND ba.is_active = true";

    public static final String COUNT_CARDS_BY_USER_ID =
            "SELECT COUNT(*) " +
                    "FROM cards c " +
                    "WHERE c.user_id = :userId";

    public static final String FIND_ACTIVE_CARD_BY_CARD_ID_AND_USER_ID =
            "SELECT c.* " +
                    "FROM cards c " +
                    "WHERE c.card_id = :cardId " +
                    "AND c.user_id = :userId " +
                    "AND c.is_active = true";

    public static final String CLEAR_DEFAULT_CARD_FOR_USER =
            "UPDATE cards " +
                    "SET is_default = false " +
                    "WHERE user_id = :userId " +
                    "AND is_default = true";

    public static final String FIND_CONTACTS_BY_USER_ID_ORDER_BY_ALIAS_ASC =
            "SELECT c.* " +
                    "FROM contacts c " +
                    "WHERE c.user_id = :userId " +
                    "ORDER BY c.alias ASC";

    public static final String FIND_CONTACT_BY_CONTACT_ID_AND_USER_ID =
            "SELECT c.* " +
                    "FROM contacts c " +
                    "WHERE c.contact_id = :contactId " +
                    "AND c.user_id = :userId";

    public static final String EXISTS_BY_USER_USERID =
            "SELECT CASE WHEN EXISTS (" +
                    "  SELECT 1 FROM merchants m WHERE m.user_id = :userId" +
                    ") THEN TRUE ELSE FALSE END";

    public static final String EXISTS_BY_EMAIL =
            "SELECT CASE WHEN EXISTS (" +
                    "  SELECT 1 FROM users u WHERE u.email = :email" +
                    ") THEN 1 ELSE 0 END";

    public static final String EXISTS_BY_PHONE =
            "SELECT CASE WHEN EXISTS (" +
                    "  SELECT 1 FROM users u WHERE u.phone_number = :phoneNumber" +
                    ") THEN 1 ELSE 0 END";

    public static final String FIND_TOP10_NOTIFICATIONS_BY_USER_ID_ORDER_BY_CREATED_AT_DESC =
            "SELECT n.* " +
                    "FROM notifications n " +
                    "WHERE n.user_id = :userId " +
                    "ORDER BY n.created_at DESC " +
                    "LIMIT 10";

    public static final String MARK_ALL_NOTIFICATIONS_AS_READ =
            "UPDATE notifications " +
                    "SET status = :readStatus " +
                    "WHERE user_id = :userId " +
                    "AND status = :unreadStatus";

    public static final String FIND_PAYMENT_REQUEST_BY_ID =
            "SELECT pr.* " +
                    "FROM payment_requests pr " +
                    "WHERE pr.payment_request_id = :paymentRequestId";

    public static final String FIND_ACTIVE_PAYMENT_REQUESTS_EXPIRED_AT_OR_BEFORE =
            "SELECT pr.* " +
                    "FROM payment_requests pr " +
                    "WHERE pr.is_active = true " +
                    "AND pr.expires_at <= :now";

    public static final String FIND_REQUEST_PARTICIPANTS_BY_REQUEST_ID =
            "SELECT rp.* " +
                    "FROM request_participants rp " +
                    "WHERE rp.request_id = :requestId";

    public static final String FIND_REQUEST_PARTICIPANT_BY_REQUEST_ID_AND_RECIPIENT_ID =
            "SELECT rp.* " +
                    "FROM request_participants rp " +
                    "WHERE rp.request_id = :requestId " +
                    "AND rp.recipient_id = :recipientId";

    public static final String COUNT_REQUEST_PARTICIPANTS_BY_REQUEST_ID =
            "SELECT COUNT(*) " +
                    "FROM request_participants rp " +
                    "WHERE rp.request_id = :requestId";

    public static final String COUNT_REQUEST_PARTICIPANTS_BY_REQUEST_ID_AND_STATUS =
            "SELECT COUNT(*) " +
                    "FROM request_participants rp " +
                    "WHERE rp.request_id = :requestId " +
                    "AND rp.status = :status";

    public static final String FIND_TRANSACTION_BY_IDEMPOTENCY_KEY =
            "SELECT t.* " +
                    "FROM transactions t " +
                    "WHERE t.idempotency_key = :idempotencyKey";

    public static final String FIND_TRANSACTIONS_BY_SENDER_ID_OR_RECEIVER_ID_ORDER_BY_CREATED_AT_DESC =
            "SELECT t.* " +
                    "FROM transactions t " +
                    "WHERE t.sender_id = :senderId " +
                    "OR t.receiver_id = :receiverId " +
                    "ORDER BY t.created_at DESC";

    public static final String FIND_LATEST_TRANSACTIONS_FOR_USER =
            "SELECT t.* " +
                    "FROM transactions t " +
                    "WHERE t.sender_id = :userId " +
                    "OR t.receiver_id = :userId " +
                    "ORDER BY t.created_at DESC";


    public static final String FIND_USER_BY_EMAIL =
            "SELECT u.* " +
                    "FROM users u " +
                    "WHERE u.email = :email";

    public static final String FIND_USER_BY_PHONE_NUMBER =
            "SELECT u.* " +
                    "FROM users u " +
                    "WHERE u.phone_number = :phoneNumber";

    public static final String FIND_USER_BY_PAYMENT_ID =
            "SELECT u.* " +
                    "FROM users u " +
                    "WHERE u.payment_id = :paymentId";

    public static final String FIND_USER_BY_USER_ID =
            "SELECT u.* " +
                    "FROM users u " +
                    "WHERE u.user_id = :userId";

    public static final String FIND_ALL_USERS_BY_KYC_STATUS =
            "SELECT u.* " +
                    "FROM users u " +
                    "WHERE u.kyc_status = :kycStatus";

    public static final String FIND_WALLET_BY_USER_ID =
            "SELECT w.* " +
                    "FROM wallets w " +
                    "WHERE w.user_id = :userId";

    public static final String FIND_WALLET_BY_USER_EMAIL =
            "SELECT w.* " +
                    "FROM wallets w " +
                    "JOIN users u ON u.user_id = w.user_id " +
                    "WHERE u.email = :email";
}
