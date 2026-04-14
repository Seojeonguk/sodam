package com.sodam.userservice.security;

import com.sodam.userservice.config.JwtTokenProvider;
import com.sodam.userservice.domain.model.Role;
import com.sodam.userservice.domain.model.User;
import jakarta.servlet.http.Cookie;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OAuth2SuccessHandlerTest {

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private OAuth2SuccessHandler oAuth2SuccessHandler;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(oAuth2SuccessHandler, "frontendUrl", "http://localhost:5173");
    }

    @Test
    @DisplayName("oauth success handler sets refresh cookie and redirects to frontend")
    void onAuthenticationSuccess_setsCookieAndRedirects() throws Exception {
        User user = User.builder()
                .id(1L)
                .email("oauth@example.com")
                .name("oauth-user")
                .password("password")
                .role(Role.USER)
                .build();
        CustomOAuth2User principal = new CustomOAuth2User(user, Map.of("email", "oauth@example.com"));
        Authentication authentication =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

        when(jwtTokenProvider.generateRefreshToken("oauth@example.com")).thenReturn("refresh-token");

        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        oAuth2SuccessHandler.onAuthenticationSuccess(request, response, authentication);

        Cookie refreshCookie = response.getCookie("refreshToken");
        assertThat(refreshCookie).isNotNull();
        assertThat(refreshCookie.getValue()).isEqualTo("refresh-token");
        assertThat(refreshCookie.isHttpOnly()).isTrue();
        assertThat(refreshCookie.getSecure()).isTrue();
        assertThat(refreshCookie.getPath()).isEqualTo("/");
        assertThat(refreshCookie.getMaxAge()).isPositive();
        assertThat(response.getRedirectedUrl()).isEqualTo("http://localhost:5173");
    }
}
