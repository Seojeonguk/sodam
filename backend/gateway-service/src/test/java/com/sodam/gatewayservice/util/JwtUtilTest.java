package com.sodam.gatewayservice.util;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class JwtUtilTest {

    private JwtUtil jwtUtil;
    private String secret;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        secret = "0123456789012345678901234567890101234567890123456789012345678901";
        ReflectionTestUtils.setField(jwtUtil, "secretKey", secret);
    }

    @Test
    @DisplayName("validateToken returns true for a valid token")
    void validateToken_returnsTrueForValidToken() {
        String token = createToken("user@example.com", 60_000L);

        assertThat(jwtUtil.validateToken(token)).isTrue();
        assertThat(jwtUtil.getUserEmail(token)).isEqualTo("user@example.com");
    }

    @Test
    @DisplayName("validateToken returns false for malformed token")
    void validateToken_returnsFalseForMalformedToken() {
        assertThat(jwtUtil.validateToken("bad-token")).isFalse();
    }

    private String createToken(String subject, long expiresInMillis) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setSubject(subject)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusMillis(expiresInMillis)))
                .signWith(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512"), SignatureAlgorithm.HS512)
                .compact();
    }
}
