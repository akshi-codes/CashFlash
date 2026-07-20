package com.endava.cashflash.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Configuration
public class ThreadConfig {

    // Provides a virtual thread executor for admin stats tasks
    @Bean(destroyMethod = "close")
    public ExecutorService adminStatsExecutor() {
        return Executors.newVirtualThreadPerTaskExecutor();
    }
}