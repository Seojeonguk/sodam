package com.sodam.transactionservice.infrastructure;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@ToString
@Setter
@Getter
public class UserDto {
    private Long id;

    private String email;
    private String name;
    private String password; // 소셜 로그인에는 필요 없을 수 있음
    private String imageUrl;

    private String authProvider;

    private String providerId;

    private String role; // enum Role { USER, ADMIN }
}
