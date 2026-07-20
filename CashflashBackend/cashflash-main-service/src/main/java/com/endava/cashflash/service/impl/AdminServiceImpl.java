package com.endava.cashflash.service.impl;

import com.endava.cashflash.constants.Literals;
import com.endava.cashflash.dto.internal.ServerStatsResponse;
import com.endava.cashflash.dto.request.ActivateUserRequest;
import com.endava.cashflash.dto.request.DeactivateUserRequest;
import com.endava.cashflash.dto.response.ActivateUserResponse;
import com.endava.cashflash.dto.response.AdminOverviewResponse;
import com.endava.cashflash.dto.response.AdminUserResponse;
import com.endava.cashflash.dto.response.DeactivateUserResponse;
import com.endava.cashflash.enums.NotificationStatus;
import com.endava.cashflash.exception.ResourceNotFoundException;
import com.endava.cashflash.model.User;
import com.endava.cashflash.repository.AuditLogRepository;
import com.endava.cashflash.repository.MerchantRepository;
import com.endava.cashflash.repository.TransactionRepository;
import com.endava.cashflash.repository.UserRepository;
import com.endava.cashflash.service.AdminService;
import com.endava.cashflash.service.AuditLogService;
import com.endava.cashflash.service.NotificationService;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.lang.management.ManagementFactory;
import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
// Builds admin dashboard views and moderation data.
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository; // Repository to manage user records
    private final MerchantRepository merchantRepository;
    private final TransactionRepository transactionRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;
    private final MeterRegistry meterRegistry;

    @Override
    public AdminOverviewResponse getOverview() {

        var transactionOverview = transactionRepository.overview(); // Fetches aggregated transaction statistics

        long totalUsers = userRepository.count();
        long totalMerchants = merchantRepository.count();
        long totalTransactions = transactionOverview.total();
        long successfulTransactions = transactionOverview.successful();
        long pendingTransactions = transactionOverview.pending();
        long failedTransactions = transactionOverview.failed();
        BigDecimal totalAmount = transactionOverview.totalAmount();
        long uptimeSeconds = ManagementFactory.getRuntimeMXBean().getUptime() / 1000;
        long loginCount = auditLogRepository.countByEntityNameAndAction(
                Literals.AUTH_USER,
                Literals.LOG_IN
        );
        ServerStatsResponse serverStats = buildServerStats(); // Builds current JVM and HTTP metrics snapshot

        return new AdminOverviewResponse(
                totalUsers,
                totalMerchants,
                totalTransactions,
                successfulTransactions,
                pendingTransactions,
                failedTransactions,
                totalAmount,
                uptimeSeconds,
                loginCount,
                serverStats
        );
    }

    @Override
    public List<AdminUserResponse> getAllUsers() {
        return userRepository.findAll(Sort.by(Sort.Direction.DESC, Literals.CREATED_AT))
                .stream()
                .map(this::mapToAdminUserResponse)
                .toList();
    }

    private AdminUserResponse mapToAdminUserResponse(User user) {
        return new AdminUserResponse(
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getProfileImageUrl(),
                user.getKycStatus(),
                user.getKycDocumentPath(),
                user.getPaymentId(),
                user.getRole(),
                user.getCreatedAt(),
                user.getIsActive()
        );
    }

    private ServerStatsResponse buildServerStats() {
        double heapUsedBytes = sumMemoryGauges(Literals.JVM_MEMORY_USED, Literals.HEAP);
        double heapMaxBytes = sumMemoryGauges(Literals.JVM_MEMORY_MAX, Literals.HEAP);
        double nonHeapUsedBytes = sumMemoryGauges(Literals.JVM_MEMORY_USED, Literals.NONHEAP);
        double liveThreads = gaugeValue(Literals.JVM_THREADS_LIVE);
        double processCpuUsage = gaugeValue(Literals.PROCESS_CPU_USAGE);
        double systemCpuUsage = gaugeValue(Literals.SYSTEM_CPU_USAGE);
        HttpAgg http = aggregateHttpRequests(); // Aggregates HTTP request counts and latency metrics

        return new ServerStatsResponse(
                heapUsedBytes,
                heapMaxBytes,
                nonHeapUsedBytes,
                liveThreads,
                processCpuUsage,
                systemCpuUsage,
                http.total,
                http.c2xx,
                http.c4xx,
                http.c5xx,
                http.avgMs,
                http.maxMs
        );
    }

    private double gaugeValue(String name) {
        Gauge g = meterRegistry.find(name).gauge();
        return g == null ? 0.0 : g.value(); // Returns zero when the metric is unavailable
    }

    private double sumMemoryGauges(String meterName, String area) {
        Collection<Gauge> gauges = meterRegistry.find(meterName)
                .tag(Literals.AREA, area)
                .gauges();

        if (gauges.isEmpty()) return 0.0;

        double sum = 0.0;
        for (Gauge g : gauges) {
            sum += g.value();
        }
        return sum; // Sums all matching memory pool values for the given area
    }

    private HttpAgg aggregateHttpRequests() {
        Collection<Timer> timers = meterRegistry.find(Literals.HTTP_SERVER_REQUESTS).timers();

        if (timers.isEmpty()) {
            return new HttpAgg(0, 0, 0, 0, 0.0, 0.0);
        }

        long total = 0;
        long c2xx = 0;
        long c4xx = 0;
        long c5xx = 0;
        double totalTimeMs = 0.0;
        double maxMs = 0.0;

        for (Timer t : timers) {
            long count = t.count();
            if (count == 0) continue;

            total += count;
            totalTimeMs += t.totalTime(TimeUnit.MILLISECONDS);

            double timerMax = t.max(TimeUnit.MILLISECONDS);
            if (timerMax > maxMs) maxMs = timerMax;

            String status = t.getId().getTag(Literals.STATUS_TAG); // Reads HTTP status like 200, 404, or 500
            if (status != null && !status.isEmpty() && Character.isDigit(status.charAt(0))) {
                char first = status.charAt(0);
                if (first == '2') c2xx += count;
                else if (first == '4') c4xx += count;
                else if (first == '5') c5xx += count;
            }
        }

        double avgMs = total > 0 ? (totalTimeMs / total) : 0.0;

        return new HttpAgg(
                total,
                c2xx,
                c4xx,
                c5xx,
                avgMs,
                maxMs
        );
    }

    private record HttpAgg(
            long total,
            long c2xx,
            long c4xx,
            long c5xx,
            double avgMs,
            double maxMs
    ) {
    }

    @Override
    @Transactional
    public ActivateUserResponse activateUser(
            Long userId,
            ActivateUserRequest request
    ) {

        User admin = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(Literals.ADMIN_RESOURCE, userId));

        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResourceNotFoundException(Literals.USER_RESOURCE, request.userId()));

        Boolean oldIsActive = user.getIsActive(); // Captures previous state for audit logging

        user.activate();

        auditLogService.log(
                userId,
                Literals.ADMIN,
                Literals.ACTIVATE_USER,
                """
                {
                    "USER_ID": %s,
                    "IS_ACTIVE": %s
                }
                """.formatted(
                        user.getUserId(),
                        oldIsActive
                ),
                """
                {
                    "USER_ID": %s,
                    "IS_ACTIVE": %s,
                    "ACTIVATED_BY_ADMIN": %s
                }
                """.formatted(
                        user.getUserId(),
                        user.getIsActive(),
                        admin.getFullName()
                )
        );

        notificationService.notification(
                user,
                Literals.ACCOUNT_ACTIVATED_BY_ADMIN_MESSAGE,
                NotificationStatus.UNREAD
        );

        return new ActivateUserResponse(
                user.getUserId(),
                true
        );
    }

    @Override
    @Transactional
    public DeactivateUserResponse deactivateUser(
            Long userId,
            DeactivateUserRequest request
    ) {

        User admin = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(Literals.ADMIN_RESOURCE, userId));

        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResourceNotFoundException(Literals.USER_RESOURCE, request.userId()));

        Boolean oldIsActive = user.getIsActive(); // Captures previous state for audit logging

        user.deactivate();

        auditLogService.log(
                userId,
                Literals.ADMIN,
                Literals.DEACTIVATE_USER,
                """
                {
                    "USER_ID": %s,
                    "IS_ACTIVE": %s
                }
                """.formatted(
                        user.getUserId(),
                        oldIsActive
                ),
                """
                {
                    "USER_ID": %s,
                    "IS_ACTIVE": %s,
                    "DEACTIVATED_BY_ADMIN": %s
                }
                """.formatted(
                        user.getUserId(),
                        user.getIsActive(),
                        admin.getFullName()
                )
        );

        notificationService.notification(
                user,
                Literals.ACCOUNT_DEACTIVATED_BY_ADMIN_MESSAGE,
                NotificationStatus.UNREAD
        );

        return new DeactivateUserResponse(
                user.getUserId(),
                true
        );
    }
}
