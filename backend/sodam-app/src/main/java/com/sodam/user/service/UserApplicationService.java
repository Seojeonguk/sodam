package com.sodam.user.service;

import com.sodam.user.domain.Role;
import com.sodam.user.domain.User;
import com.sodam.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class UserApplicationService {

    private final UserDomainService userDomainService;

    // 순환 의존성 방지 (@Lazy)
    private final AccountBookRegistrar accountBookRegistrar;

    @Autowired
    public UserApplicationService(UserDomainService userDomainService,
                                   @Lazy AccountBookRegistrar accountBookRegistrar) {
        this.userDomainService = userDomainService;
        this.accountBookRegistrar = accountBookRegistrar;
    }

    /**
     * Supabase JWT 인증 후 첫 요청 시 사용자 동기화.
     * DB에 없으면 신규 생성 + 기본 가계부 초기화.
     */
    @Transactional
    public User syncUser(String email, String name) {
        Optional<User> existing = userDomainService.findOptionalByEmail(email);
        if (existing.isPresent()) {
            return existing.get();
        }

        String displayName = (name != null && !name.isBlank())
                ? name
                : email.split("@")[0];

        User newUser = User.builder()
                .email(email)
                .name(displayName)
                .role(Role.USER)
                .build();

        User saved = userDomainService.save(newUser);
        log.info("신규 유저 자동 생성: id={}, email={}", saved.getId(), saved.getEmail());

        accountBookRegistrar.createDefaultAccountBookForUser(saved);
        return saved;
    }

    @Transactional(readOnly = true)
    public UserResponse findUserByEmail(String email) {
        return UserResponse.fromEntity(userDomainService.findUserByEmail(email));
    }

    @Transactional(readOnly = true)
    public List<UserResponse> findUsersByIds(List<Long> ids) {
        return userDomainService.findUsersByIds(ids).stream()
                .map(UserResponse::fromEntity)
                .toList();
    }

    @Transactional
    public void deleteUser(String email) {
        User user = userDomainService.findUserByEmail(email);
        userDomainService.deleteUser(user.getId());
    }
}
