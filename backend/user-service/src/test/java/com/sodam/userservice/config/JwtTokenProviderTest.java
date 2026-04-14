package com.sodam.userservice.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(jwtTokenProvider, "issuer", "sodam");
        ReflectionTestUtils.setField(
                jwtTokenProvider,
                "secretKey",
                "0123456789012345678901234567890101234567890123456789012345678901"
        );
        ReflectionTestUtils.setField(jwtTokenProvider, "accessTokenExpiration", 60_000L);
        ReflectionTestUtils.setField(jwtTokenProvider, "refreshTokenExpiration", 120_000L);
    }

    @Test
    @DisplayName("generateAccessToken creates a valid token with the user email as subject")
    void generateAccessToken_createsValidToken() {
        String token = jwtTokenProvider.generateAccessToken("user@example.com");

        assertThat(token).isNotBlank();
        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
        assertThat(jwtTokenProvider.getUserEmail(token)).isEqualTo("user@example.com");
    }

    @Test
    @DisplayName("generateRefreshToken creates a valid refresh token")
    void generateRefreshToken_createsValidRefreshToken() {
        String token = jwtTokenProvider.generateRefreshToken("refresh@example.com");

        assertThat(token).isNotBlank();
        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
        assertThat(jwtTokenProvider.getUserEmail(token)).isEqualTo("refresh@example.com");
    }

    @Test
    @DisplayName("validateToken returns false for malformed token")
    void validateToken_returnsFalseForMalformedToken() {
        assertThat(jwtTokenProvider.validateToken("not-a-jwt-token")).isFalse();
    }

    @Test
    @DisplayName("validateToken returns false for expired token")
    void validateToken_returnsFalseForExpiredToken() {
        ReflectionTestUtils.setField(jwtTokenProvider, "accessTokenExpiration", -1L);

        String token = jwtTokenProvider.generateAccessToken("expired@example.com");

        assertThat(jwtTokenProvider.validateToken(token)).isFalse();
    }
}
