package com.sodam.user.dto;

import com.sodam.user.domain.User;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserResponse {
    private Long id;
    private String email;
    private String name;
    private String imageUrl;

    public static UserResponse fromEntity(User user) {
        UserResponse r = new UserResponse();
        r.setId(user.getId());
        r.setEmail(user.getEmail());
        r.setName(user.getName());
        r.setImageUrl(user.getImageUrl());
        return r;
    }
}
