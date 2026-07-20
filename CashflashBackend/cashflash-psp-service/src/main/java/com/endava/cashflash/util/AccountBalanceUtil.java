package com.endava.cashflash.util;

import com.endava.cashflash.constants.NumericalConstants;

import java.math.BigDecimal;
import java.util.concurrent.ThreadLocalRandom;

// Generates mock balances for linked PSP instruments.
public class AccountBalanceUtil {

    public static BigDecimal generateRandomBalance() {
        int random = ThreadLocalRandom.current().nextInt(NumericalConstants.MIN_BALANCE, NumericalConstants.MAX_BALANCE + 1);
        return BigDecimal.valueOf(random);
    }
}
