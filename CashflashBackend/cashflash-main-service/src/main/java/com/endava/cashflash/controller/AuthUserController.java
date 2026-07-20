package com.endava.cashflash.controller;

import com.endava.cashflash.constants.ApiPaths;
import com.endava.cashflash.dto.request.*;
import com.endava.cashflash.dto.response.*;
import com.endava.cashflash.security.AuthPrincipal;
import com.endava.cashflash.service.AuthUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping(ApiPaths.AUTH_USER_BASE)
// Handles authentication and account recovery requests.
public class AuthUserController  {

    // Service that handles authentication logic
    private final AuthUserService authUserService;

    @PostMapping(ApiPaths.LOG_IN)
    public LogInResponse logIn(@Valid @RequestBody LogInRequest request) { // Accepts login request data
        return authUserService.logIn(request); // Returns login response from service
    }

    @PostMapping(ApiPaths.GET_OTP)
    public GetOtpResponse getOtp(@Valid @RequestBody GetOtpRequest request) { // Accepts email request data
        return authUserService.getOtp(request); // Returns OTP response from service
    }

    @PostMapping(ApiPaths.VERIFY_OTP)
    public VerifyOtpResponse verifyOtp(@Valid @RequestBody VerifyOtpRequest request) { // Accepts OTP request data
        return authUserService.verifyOtp(request); // Returns status response from service
    }

    @PostMapping(ApiPaths.RESET_PASSWORD)
    public ResetPasswordResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) { // Accepts password request data
        return authUserService.resetPassword(request); // Returns reset response from service
    }

    @PostMapping(ApiPaths.SET_PIN)
    public SetPinResponse setPin(
            @AuthenticationPrincipal AuthPrincipal principal,
            @Valid @RequestBody SetPinRequest request
    ) { // Accepts password request data
        return authUserService.setPin(principal.getUserId(), request); // Returns reset response from service
    }

    @PostMapping(ApiPaths.VERIFY_PIN)
    public VerifyPinResponse verifyPin(
            @AuthenticationPrincipal AuthPrincipal principal,
            @Valid @RequestBody VerifyPinRequest request
    ) {
        return authUserService.verifyPin(principal.getUserId(), request);
    }
}
