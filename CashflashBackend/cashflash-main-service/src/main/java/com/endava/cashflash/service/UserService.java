package com.endava.cashflash.service;

import com.endava.cashflash.dto.request.SignUpRequest;
import com.endava.cashflash.dto.response.SignUpResponse;
import com.endava.cashflash.dto.response.UserPaymentMethodsResponse;
import org.springframework.web.multipart.MultipartFile;

public interface UserService{
    SignUpResponse signUp(SignUpRequest request); //to sign-in
    UserPaymentMethodsResponse getUserPaymentMethods(Long userId);
    String setProfilePicture(Long userId, MultipartFile file);
}
