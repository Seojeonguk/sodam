package com.sodam.userservice.config;

import io.jsonwebtoken.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;

@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${jwt.issuer}")
    private String issuer;

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.access-expiration}")
    private long accessTokenExpiration;

    @Value("${jwt.refresh-expiration}")
    private long refreshTokenExpiration;

    /**
     * JWT 토큰을 생성합니다.
     * @param userId 토큰에 담을 사용자 ID
     * @return 생성된 JWT 토큰 문자열
     */
    public String generateAccessToken(String userId) {
        return generateToken(userId, accessTokenExpiration);
    }

    public String generateRefreshToken(String userId) {
        return generateToken(userId, refreshTokenExpiration);
    }

    public String generateToken(String userId, long expiration) {
        Instant now = Instant.now();
        Date expiryDate = Date.from(now.plusMillis(expiration));

        return Jwts.builder()
                .setSubject(userId)
                .setIssuer(issuer)
                .setIssuedAt(Date.from(now))
                .setExpiration(expiryDate)
                .signWith(generateKey(secretKey), SignatureAlgorithm.HS512)
                .compact();
    }

    public static Key generateKey (String strSecretKey ) {
        byte[] decodedKey = strSecretKey.getBytes( StandardCharsets.UTF_8 );
        return new SecretKeySpec(decodedKey, "HmacSHA512");
    }

    /**
     * JWT 토큰에서 사용자 ID를 추출합니다.
     * @param token 사용자 ID를 추출할 JWT 토큰
     * @return 추출된 사용자 ID 문자열
     */
    public String getUserIdFromJWT(String token) {
        return Jwts.parser().setSigningKey(secretKey).parseClaimsJws(token).getBody().getSubject();
    }

    /**
     * JWT 토큰의 유효성을 검증합니다.
     * @param authToken 유효성을 검증할 JWT 토큰
     * @return 토큰이 유효하면 true, 아니면 false
     */
    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(generateKey(secretKey)).build().parseClaimsJws(authToken);
            return true;
        } catch (Exception ex) {
            log.error("토큰 유효성 검사 통과 실패. 사유 : {}", ex.getMessage());
            return false;
        }
    }

    public String getUserEmail(String token) {
        Claims claims = parseClaims(token);
        return claims.getSubject();
    }

    public Claims parseClaims(String token) {
        Key signingKey = generateKey(secretKey);
        return Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}