package com.sodam.gatewayservice.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component
@Slf4j
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secretKey;

    public Claims parseClaims(String token) {
        Key signingKey = generateKey(secretKey);
        return Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public String getUserEmail(String token) {
        Claims claims = parseClaims(token);
        return claims.getSubject();
    }

    public boolean validateToken(String token) {
        try {
            // parseClaims에서 서명 검증 및 구조 검증
            Claims claims = parseClaims(token);

            // 만료 여부 확인
            if (claims.getExpiration().before(new Date())) {
                log.error("JWT 인증 토큰이 만료되었습니다.");
                return false;
            }

            return true;
        } catch (Exception e) {
            // JwtException, IllegalArgumentException 등 예외 발생 시 false 반환
            log.error("JWT 토큰 검증 과정에서 오류가 발생하였습니다.", e);
            return false;
        }
    }

    public static Key generateKey(String strSecretKey) {
        byte[] decodedKey = strSecretKey.getBytes(StandardCharsets.UTF_8);
        return new SecretKeySpec(decodedKey, "HmacSHA512");
    }
}
