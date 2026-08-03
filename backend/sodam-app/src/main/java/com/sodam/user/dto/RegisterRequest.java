package com.sodam.user.dto;

import com.sodam.user.domain.Role;
import com.sodam.user.domain.User;
import lombok.Data;

@Data
public class RegisterRequest {
    private String email;
    private String password;
    private String name;

    public User toEntity(String encodedPassword, Role role) {
        return User.builder()
                .email(email)
                .password(encodedPassword)
                .name(name)
                .role(role)
                .build();
    }
}
