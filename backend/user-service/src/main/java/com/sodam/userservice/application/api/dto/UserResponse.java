package com.sodam.userservice.application.api.dto;

import com.sodam.userservice.domain.model.User;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class UserResponse {
    private Long id;
    private String email;
    private String name;
    private String imageUrl;

    public static UserResponse fromEntity(User user) {
        UserResponse userResponse = new UserResponse();
        userResponse.setId(user.getId());
        userResponse.setEmail(user.getEmail());
        userResponse.setName(user.getName());
        userResponse.setImageUrl(user.getImageUrl());
        return userResponse;
    }
}
