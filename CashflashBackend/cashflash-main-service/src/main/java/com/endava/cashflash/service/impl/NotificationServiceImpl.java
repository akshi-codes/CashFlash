package com.endava.cashflash.service.impl;

import com.endava.cashflash.dto.internal.NotificationWebSocket;
import com.endava.cashflash.enums.NotificationStatus;
import com.endava.cashflash.model.Notification;
import com.endava.cashflash.model.User;
import com.endava.cashflash.repository.NotificationRepository;
import com.endava.cashflash.service.NotificationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
// Handles notification persistence and WebSocket delivery.
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public List<Notification> getAllNotifications(Long userId) {
        return notificationRepository.findTop10ByUser_UserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(
                userId,
                NotificationStatus.READ,
                NotificationStatus.UNREAD
        );
    }

    @Override
    public void notification(
            User user,
            String message,
            NotificationStatus status
    ) {
        Notification saveNotification = notificationRepository.save(Notification.builder()
                .user(user)
                .message(message)
                .status(status)
                .build()
        );

        NotificationWebSocket notificationWebSocket = new NotificationWebSocket(
                saveNotification.getNotificationId(),
                saveNotification.getMessage(),
                saveNotification.getStatus(),
                saveNotification.getCreatedAt()
        );

        messagingTemplate.convertAndSendToUser(
                user.getUserId().toString(),
                "/queue/notifications",
                notificationWebSocket
        );
    }
}
