package com.endava.cashflash.repository;

import com.endava.cashflash.constants.Queries;
import com.endava.cashflash.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

// Provides audit-log persistence and aggregate queries.
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query(value = Queries.COUNT_BY_ENTITY_NAME_AND_ACTION, nativeQuery = true)
    long countByEntityNameAndAction(@Param("entityName") String entityName,
                                    @Param("action") String action);
}
