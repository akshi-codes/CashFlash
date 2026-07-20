package com.endava.cashflash.service.impl;

import com.endava.cashflash.model.AuditLog;
import com.endava.cashflash.repository.AuditLogRepository;
import com.endava.cashflash.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;

    // Helper method to add logs where required
    @Override
    public void log(
            Long entityId,
            String entityName,
            String action,
            String oldValueJson,
            String newValueJson
    ) {
        auditLogRepository.save(AuditLog.builder()
                .entityId(entityId)
                .entityName(entityName)
                .action(action)
                .oldValueJson(oldValueJson)
                .newValueJson(newValueJson)
                .build());
    }
}
