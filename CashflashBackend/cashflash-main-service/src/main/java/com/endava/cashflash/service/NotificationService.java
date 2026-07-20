package com.endava.cashflash.service;

import com.endava.cashflash.enums.NotificationStatus;
import com.endava.cashflash.model.Notification;
import com.endava.cashflash.model.User;

import java.util.List;

// Defines notification read and delivery operations.
public interface NotificationService {

    List<Notification> getAllNotifications(Long userId);

    void markAllAsRead(Long userId );

    void notification(User user, String message, NotificationStatus status);
}
