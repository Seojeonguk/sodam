package com.sodam.gatewayservice.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sodam.common.response.ApiResponse;
import com.sodam.common.response.ResponseCode;
import com.sodam.common.security.HeaderNames;
import com.sodam.gatewayservice.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthGatewayFilter implements GatewayFilter {

    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.error("JWT 토큰 정보가 존재하지 않습니다.");
            return writeErrorResponse(exchange, ResponseCode.UNAUTHORIZED, "인증 토큰이 없습니다.");
        }

        String token = authHeader.substring(7);

        if (!jwtUtil.validateToken(token)) {
            log.error("JWT 토큰 검증에 실패했습니다.");
            return writeErrorResponse(exchange, ResponseCode.UNAUTHORIZED, "유효하지 않은 인증 토큰입니다.");
        }

        String email = jwtUtil.getUserEmail(token);
        log.debug("JWT 토큰 검증 결과 사용자 이메일 정보 : {}", email);

        ServerHttpRequest request = exchange.getRequest().mutate()
                .header(HeaderNames.USER_EMAIL, String.valueOf(email))
                .build();

        return chain.filter(exchange.mutate().request(request).build());
    }

    private Mono<Void> writeErrorResponse(ServerWebExchange exchange, ResponseCode code, String message) {
        try {
            byte[] body = objectMapper.writeValueAsBytes(ApiResponse.fail(code.getCode(), message));
            exchange.getResponse().setStatusCode(HttpStatus.valueOf(code.getStatus()));
            exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
            DataBuffer buffer = exchange.getResponse().bufferFactory().wrap(body);
            return exchange.getResponse().writeWith(Mono.just(buffer));
        } catch (Exception e) {
            log.error("Gateway 인증 실패 응답 작성 중 오류가 발생했습니다.", e);
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
            DataBuffer fallback = exchange.getResponse().bufferFactory()
                    .wrap("{\"code\":\"E-00002\",\"message\":\"인증 처리 중 오류가 발생했습니다.\",\"data\":null}"
                            .getBytes(StandardCharsets.UTF_8));
            return exchange.getResponse().writeWith(Mono.just(fallback));
        }
    }
}
