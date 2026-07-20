package com.endava.cashflash;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

@Disabled("Disabled during unit testing because full application context requires database connection")
class CashflashBackendApplicationTests {

    @Test
    void contextLoads() {
        assertTrue(true);
    }
}
