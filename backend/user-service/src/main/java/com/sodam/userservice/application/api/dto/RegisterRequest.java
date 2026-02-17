package com.sodam.userservice.application.api.dto;

import com.sodam.userservice.domain.model.Role;
import com.sodam.userservice.domain.model.User;
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
