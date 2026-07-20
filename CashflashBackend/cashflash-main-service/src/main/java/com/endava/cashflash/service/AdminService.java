package com.endava.cashflash.service;

import com.endava.cashflash.dto.request.ActivateUserRequest;
import com.endava.cashflash.dto.request.DeactivateUserRequest;
import com.endava.cashflash.dto.response.ActivateUserResponse;
import com.endava.cashflash.dto.response.AdminOverviewResponse;
import com.endava.cashflash.dto.response.AdminUserResponse;
import com.endava.cashflash.dto.response.DeactivateUserResponse;

import java.util.List;

// Defines admin dashboard and account-control operations.
public interface AdminService {
    AdminOverviewResponse getOverview();
    List<AdminUserResponse> getAllUsers();
    ActivateUserResponse activateUser(Long userId, ActivateUserRequest request);
    DeactivateUserResponse deactivateUser(Long userId, DeactivateUserRequest request);

}
