package com.sodam.common.security;

import io.jsonwebtoken.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.Key;

/**
 * Supabase가 발급한 JWT를 검증합니다.
 * 토큰 발급은 Supabase Auth가 담당하므로 생성 메서드는 없습니다.
 */
@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secretKey;

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(buildKey(secretKey))
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("만료된 JWT: {}", e.getMessage());
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("유효하지 않은 JWT: {}", e.getMessage());
        }
        return false;
    }

    /**
     * Supabase JWT의 'email' 클레임에서 이메일 추출
     */
    public String getEmail(String token) {
        Claims claims = parseClaims(token);
        // Supabase JWT: 'email' 클레임에 이메일이 직접 포함됨
        String email = claims.get("email", String.class);
        if (email == null || email.isBlank()) {
            // fallback: sub 클레임 (일부 provider는 sub에 email이 올 수 있음)
            email = claims.getSubject();
        }
        return email;
    }

    /**
     * Supabase JWT의 'user_metadata.full_name' 또는 'user_metadata.name' 추출
     */
    @SuppressWarnings("unchecked")
    public String getName(String token) {
        try {
            Claims claims = parseClaims(token);
            Object metadata = claims.get("user_metadata");
            if (metadata instanceof java.util.Map) {
                java.util.Map<String, Object> map = (java.util.Map<String, Object>) metadata;
                String name = (String) map.getOrDefault("full_name",
                        map.getOrDefault("name", null));
                if (name != null && !name.isBlank()) return name;
            }
        } catch (Exception e) {
            log.debug("name 추출 실패, 이메일로 대체: {}", e.getMessage());
        }
        return null;
    }

    private Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(buildKey(secretKey))
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key buildKey(String secret) {
        return new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }
}
