package com.endava.cashflash.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "audit_log_id")
    private Long auditLogId; // Primary key

    @Column(name = "entity_id", nullable = false)
    private Long entityId; // ID of the affected entity record

    @Column(name = "entity_name", nullable = false, length = 128)
    private String entityName; // Name of the affected entity/table

    @Column(name = "action", nullable = false, length = 64)
    private String action; // Action performed

    @Lob
    @Column(name = "old_value_json", columnDefinition = "LONGTEXT")
    private String oldValueJson; // JSON snapshot of old values (before change)

    @Lob
    @Column(name = "new_value_json", columnDefinition = "LONGTEXT", nullable = false)
    private String newValueJson; // JSON snapshot of new values (after change)

    @Column(name = "created_at", updatable = false, nullable = false)
    private Instant createdAt; // Timestamp when the record was created

    @PrePersist
    private void prePersist() {
        this.createdAt = Instant.now(); // Sets createdAt automatically on insert
    }
}
