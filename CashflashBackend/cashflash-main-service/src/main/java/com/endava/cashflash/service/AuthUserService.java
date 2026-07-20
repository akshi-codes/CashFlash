package com.endava.cashflash.service;

import com.endava.cashflash.dto.request.*;
import com.endava.cashflash.dto.response.*;

public interface AuthUserService {
    LogInResponse logIn(LogInRequest request); //To login

    GetOtpResponse getOtp(GetOtpRequest request); //To get OTP

    VerifyOtpResponse verifyOtp(VerifyOtpRequest request); //To verify OTP

    ResetPasswordResponse resetPassword(ResetPasswordRequest request); // To reset password

    SetPinResponse setPin(Long userId, SetPinRequest request);

    VerifyPinResponse verifyPin(Long userId, VerifyPinRequest request);
}
