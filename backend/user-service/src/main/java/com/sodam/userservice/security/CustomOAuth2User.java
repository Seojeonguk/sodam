package com.sodam.userservice.security;

import com.sodam.userservice.domain.model.Role;
import com.sodam.userservice.domain.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;

@RequiredArgsConstructor
public class CustomOAuth2User implements OAuth2User {

    private final String nameAttributeKey;
    private final Map<String, Object> attributes;
    private final Collection<? extends GrantedAuthority> authorities;

    public CustomOAuth2User(Map<String, Object> attributes, String nameAttributeKey) {
        this.nameAttributeKey = nameAttributeKey;
        this.attributes = attributes;

        // OAuth2User의 기본 권한을 설정합니다.
        // 이 예제에서는 USER 역할을 가진다고 가정합니다.
        // 실제로는 DB에서 조회한 사용자의 Role 정보를 사용해야 합니다.
        this.authorities = Collections.singletonList(new SimpleGrantedAuthority(Role.USER.getKey()));
    }

    // User 엔티티를 기반으로 CustomOAuth2User를 생성하는 생성자
    public CustomOAuth2User(User user, Map<String, Object> attributes, String nameAttributeKey) {
        this.nameAttributeKey = nameAttributeKey;
        this.attributes = attributes;
        this.authorities = Collections.singletonList(new SimpleGrantedAuthority(user.getRole().getKey()));
    }

    @Override
    public Map<String, Object> getAttributes() {
        return this.attributes;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return this.authorities;
    }

    @Override
    public String getName() {
        // 소셜 로그인 제공자별로 사용자 이름을 가져오는 키가 다를 수 있습니다.
        // 예를 들어 Google은 "sub", Naver는 "response", Kakao는 "id" 등
        return (String) attributes.get(nameAttributeKey);
    }

    // 이메일, 프로필 이미지 URL 등 필요한 사용자 정보를 추가로 제공하는 메서드를 작성할 수 있습니다.
    public String getEmail() {
        return (String) attributes.get("email");
    }
}