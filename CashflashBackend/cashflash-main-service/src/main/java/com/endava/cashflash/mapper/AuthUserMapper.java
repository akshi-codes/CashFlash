package com.endava.cashflash.mapper;

import com.endava.cashflash.model.AuthUser;
import com.endava.cashflash.model.User;
import org.springframework.stereotype.Component;

@SuppressWarnings("unused")
@Component
public class AuthUserMapper {

    public AuthUser toAuthUser(User user, Boolean isLocked, Integer otpAttempts, String passwordHash) {

        // Maps User + password hash into AuthUser entity
        AuthUser authUser = new AuthUser();
        authUser.setUser(user);
        authUser.setIsLocked(isLocked);
        authUser.setOtpAttempts(otpAttempts);
        authUser.setPasswordHash(passwordHash);
        return authUser;
    }
}
