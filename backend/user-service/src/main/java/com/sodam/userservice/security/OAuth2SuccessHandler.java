package com.sodam.userservice.security;


import com.sodam.userservice.config.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {

        CustomOAuth2User customOAuth2User = (CustomOAuth2User) authentication.getPrincipal();

        String email = customOAuth2User.getEmail();

        // 2. userId를 기반으로 JWT 토큰 생성
        String jwtToken = jwtTokenProvider.generateAccessToken(email);

        // 3. 리다이렉트 URL 구성 (프론트엔드 URL)
        String redirectUrl = "http://localhost:3000/oauth2/redirect?token=" + jwtToken;

        // 4. 클라이언트로 리다이렉트
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}