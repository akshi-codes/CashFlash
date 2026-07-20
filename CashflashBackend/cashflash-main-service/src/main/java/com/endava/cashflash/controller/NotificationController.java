package com.endava.cashflash.controller;

import java.util.List;

import com.endava.cashflash.constants.ApiPaths;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.endava.cashflash.model.Notification;
import com.endava.cashflash.security.AuthPrincipal;
import com.endava.cashflash.service.NotificationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping(ApiPaths.NOTIFICATION_BASE)
// Exposes notification read and list endpoints.
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping(ApiPaths.NOTIFICATION_USER)
    public List<Notification> allNotifications(
            @AuthenticationPrincipal AuthPrincipal principal
    ) {
        return notificationService.getAllNotifications(
                principal.getUserId()
        );
    }

    @PutMapping(ApiPaths.NOTIFICATION_READ)
    public void markAllAsRead(
            @AuthenticationPrincipal AuthPrincipal principal
    ) {
        notificationService.markAllAsRead(
                principal.getUserId()
        );
    }

}

