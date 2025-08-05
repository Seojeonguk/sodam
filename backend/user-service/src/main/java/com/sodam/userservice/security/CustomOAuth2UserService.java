package com.sodam.userservice.security;

import com.sodam.userservice.domain.model.AuthProvider;
import com.sodam.userservice.domain.model.Role;
import com.sodam.userservice.domain.model.User;
import com.sodam.userservice.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();

        // OAuth2 제공자별로 사용자 정보를 가져오는 키가 다르므로, 이를 동적으로 처리해야 합니다.
        // 예: Google은 "sub", Naver는 "response", Kakao는 "id"
        String nameAttributeKey = userRequest.getClientRegistration()
                .getProviderDetails()
                .getUserInfoEndpoint()
                .getUserNameAttributeName();

        Map<String, Object> attributes = oAuth2User.getAttributes();
        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");

        Optional<User> optionalUser = userRepository.findByEmail(email);

        User user;
        if (optionalUser.isPresent()) {
            // 이미 존재하는 사용자라면 정보 업데이트
            user = optionalUser.get();
            user.setName(name);
        } else {
            // 신규 사용자라면 새로운 사용자 정보 저장
            user = User.builder()
                    .name(name)
                    .email(email)
                    .authProvider(AuthProvider.valueOf(registrationId.toUpperCase()))
                    .providerId((String) attributes.get(nameAttributeKey))
                    .role(Role.USER) // 신규 가입 시 기본 역할(Role.USER) 부여
                    .build();
        }

        // 업데이트 또는 신규 저장
        User savedUser = userRepository.save(user);

        // CustomOAuth2User에 저장된 사용자 정보와 속성을 담아 반환
        return new CustomOAuth2User(savedUser, attributes, nameAttributeKey);
    }
}