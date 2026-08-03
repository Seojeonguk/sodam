package com.sodam.user.service;

import com.sodam.user.domain.User;

/**
 * 유저 등록 시 기본 가계부를 생성하기 위한 인터페이스.
 * UserApplicationService ↔ AccountBookApplicationService 순환 의존성을 방지합니다.
 */
public interface AccountBookRegistrar {
    void createDefaultAccountBookForUser(User user);
}
