package com.endava.cashflash.security;

import com.endava.cashflash.enums.UserRole;
import lombok.Getter;
import lombok.NonNull;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Getter
// Stores authenticated user details in the Spring Security context.
public class AuthPrincipal implements UserDetails{

    private final Long userId;
    private final String email;
    private final UserRole role;

    public AuthPrincipal(Long userId, String email, UserRole role) {
        this.userId = userId;
        this.email = email;
        this.role = role;
    }

    @Override
    @NonNull
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (role == null) {
            return List.of();
        }
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @NonNull
    @Override public String getUsername() { return email; }
    @Override public String getPassword() { return null; }
}
