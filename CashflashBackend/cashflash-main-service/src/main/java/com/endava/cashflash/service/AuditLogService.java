package com.endava.cashflash.service;

// Defines audit-log write operations.
public interface AuditLogService {

    void log(Long entityId, String entityName, String action, String oldValueJson, String newValueJson);
}
