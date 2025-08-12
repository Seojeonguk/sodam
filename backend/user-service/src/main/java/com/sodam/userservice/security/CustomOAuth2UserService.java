package com.sodam.userservice.security;

import com.sodam.userservice.domain.model.AuthProvider;
import com.sodam.userservice.domain.model.OAuthAttributes;
import com.sodam.userservice.domain.model.Role;
import com.sodam.userservice.domain.model.User;
import com.sodam.userservice.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        log.debug("Load OAuth2 user info: {}", oAuth2User);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        log.debug("Identify registrationId: {}", registrationId);

        // OAuth2 제공자별로 사용자 정보를 가져오는 키가 다르므로, 이를 동적으로 처리해야 합니다.
        // 예: Google은 "sub", Naver는 "response", Kakao는 "id"
        String nameAttributeKey = userRequest.getClientRegistration()
                .getProviderDetails()
                .getUserInfoEndpoint()
                .getUserNameAttributeName();
        log.debug("Identify nameAttributeKey: {}", nameAttributeKey);

        OAuthAttributes attributes = OAuthAttributes.of(registrationId, nameAttributeKey, oAuth2User.getAttributes());
        log.debug("Map OAuth attributes: {}", attributes);

        Optional<User> optionalUser = userRepository.findByEmail(attributes.getEmail());
        if (optionalUser.isPresent()) {
            log.debug("Find existing user: {}", optionalUser.get());
        } else {
            log.debug("No existing user found. Create new user.");
        }

        User user;
        if (optionalUser.isPresent()) {
            // 이미 존재하는 사용자라면 정보 업데이트
            user = optionalUser.get();
            user.setName(attributes.getName());
        } else {
            // 신규 사용자라면 새로운 사용자 정보 저장
            user = User.builder()
                    .name(attributes.getName())
                    .email(attributes.getEmail())
                    .authProvider(AuthProvider.valueOf(registrationId.toUpperCase()))
                    .providerId(attributes.getNameAttributeKey())
                    .role(Role.USER) // 신규 가입 시 기본 역할(Role.USER) 부여
                    .build();
        }

        // 업데이트 또는 신규 저장
        User savedUser = userRepository.save(user);
        log.debug("Save user info: {}", savedUser);

        // CustomOAuth2User에 저장된 사용자 정보와 속성을 담아 반환
        return new CustomOAuth2User(savedUser, attributes.getAttributes());
    }
}