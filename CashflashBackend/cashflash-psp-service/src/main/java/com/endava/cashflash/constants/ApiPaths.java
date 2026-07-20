package com.endava.cashflash.constants;

public final class ApiPaths {

    private ApiPaths () {}

    public static final String API_BASE = "/api";

    // BankAccountPsp Base
    public static final String BANK_ACCOUNT_PSP_BASE = API_BASE + "/bank-account-psp";

    // BankAccountPsp endpoint
    public static final String BANK_ACCOUNT_PSP_VERIFY = "/verify";
    public static final String BANK_ACCOUNT_PSP_DEBIT = "/debit";
    public static final String BANK_ACCOUNT_PSP_CREDIT = "/credit";
    public static final String BANK_ACCOUNT_PSP_BALANCE = "/balance";

    // CardPsp Base
    public static final String CARD_PSP_BASE = API_BASE + "/card-psp";

    // CardPsp endpoint
    public static final String CARD_PSP_VERIFY = "/verify";
    public static final String CARD_PSP_DEBIT = "/debit";
    public static final String CARD_PSP_CREDIT = "/credit";

}
