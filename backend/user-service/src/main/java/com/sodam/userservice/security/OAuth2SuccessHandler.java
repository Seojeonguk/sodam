package com.sodam.userservice.security;


import com.sodam.userservice.config.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {

        // 1. JWT 토큰 생성을 위한 사용자 ID 가져오기
        String userId = authentication.getName();

        // 2. userId를 기반으로 JWT 토큰 생성
        String jwtToken = jwtTokenProvider.generateToken(userId);

        // 3. 리다이렉트 URL 구성 (프론트엔드 URL)
        String redirectUrl = "http://localhost:3000/oauth2/redirect?token=" + jwtToken;

        // 4. 클라이언트로 리다이렉트
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}