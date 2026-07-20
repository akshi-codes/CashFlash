package com.endava.cashflash.mapper;

import com.endava.cashflash.dto.request.SignUpRequest;
import com.endava.cashflash.dto.response.SignUpResponse;
import com.endava.cashflash.model.User;
import org.springframework.stereotype.Component;

@SuppressWarnings("unused")
@Component
public class UserMapper {

    public User toUser(SignUpRequest request) {

        if (request == null) return null; // Prevents null pointer errors

        // Converts signup request DTO into User entity
        User user = new User();
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setPhoneNumber(request.phoneNumber());

        return user;
    }

    public SignUpResponse toSignUpResponse(User user) {

        if (user == null) return null; // Prevents null pointer errors

        // Converts User entity into signup response DTO
        return new SignUpResponse(
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhoneNumber()
        );
    }
}
