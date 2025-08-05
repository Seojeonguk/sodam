package com.sodam.userservice.domain.model;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Role {

    // 권한을 부여할 때 사용하는 키값
    // Spring Security에서는 "ROLE_" 접두사를 사용하도록 권장합니다.
    GUEST("ROLE_GUEST", "손님"),
    USER("ROLE_USER", "일반 사용자");

    private final String key;
    private final String title;
}