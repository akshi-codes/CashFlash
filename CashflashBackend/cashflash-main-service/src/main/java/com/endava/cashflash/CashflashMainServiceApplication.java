package com.endava.cashflash;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
// Boots the main CashFlash backend service.
public class CashflashMainServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(CashflashMainServiceApplication.class, args);
	}
}
