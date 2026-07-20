package com.endava.cashflash.repository;

import com.endava.cashflash.constants.Queries;
import com.endava.cashflash.enums.NotificationStatus;
import com.endava.cashflash.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

// Provides notification persistence and bulk-read operations.
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query(value = Queries.FIND_TOP10_NOTIFICATIONS_BY_USER_ID_ORDER_BY_CREATED_AT_DESC, nativeQuery = true)
    List<Notification> findTop10ByUser_UserIdOrderByCreatedAtDesc(@Param("userId") Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = Queries.MARK_ALL_NOTIFICATIONS_AS_READ, nativeQuery = true)
    void markAllAsRead(@Param("userId") Long userId,
                       @Param("readStatus") String readStatus,
                       @Param("unreadStatus") String unreadStatus);

    default void markAllAsRead(Long userId,
                               NotificationStatus readStatus,
                               NotificationStatus unreadStatus) {
        markAllAsRead(userId, readStatus.name(), unreadStatus.name());
    }
}
