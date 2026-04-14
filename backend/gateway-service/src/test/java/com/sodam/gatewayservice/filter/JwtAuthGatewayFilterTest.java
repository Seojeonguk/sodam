package com.sodam.gatewayservice.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sodam.common.security.HeaderNames;
import com.sodam.gatewayservice.util.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.core.publisher.Mono;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtAuthGatewayFilterTest {

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private GatewayFilterChain chain;

    private JwtAuthGatewayFilter filter;

    @BeforeEach
    void setUp() {
        filter = new JwtAuthGatewayFilter(jwtUtil, new ObjectMapper());
    }

    @Test
    @DisplayName("missing authorization header returns unauthorized")
    void filter_returnsUnauthorizedWhenHeaderMissing() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/users").build()
        );

        filter.filter(exchange, chain).block();

        assertThat(exchange.getResponse().getStatusCode().value()).isEqualTo(401);
        verify(chain, never()).filter(any());
    }

    @Test
    @DisplayName("authorization header without bearer prefix returns unauthorized")
    void filter_returnsUnauthorizedWhenBearerPrefixMissing() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/users")
                        .header(HttpHeaders.AUTHORIZATION, "invalid-token")
                        .build()
        );

        filter.filter(exchange, chain).block();

        assertThat(exchange.getResponse().getStatusCode().value()).isEqualTo(401);
        verify(chain, never()).filter(any());
    }

    @Test
    @DisplayName("invalid token returns unauthorized")
    void filter_returnsUnauthorizedWhenTokenInvalid() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/users")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer invalid-token")
                        .build()
        );

        when(jwtUtil.validateToken("invalid-token")).thenReturn(false);

        filter.filter(exchange, chain).block();

        assertThat(exchange.getResponse().getStatusCode().value()).isEqualTo(401);
        verify(chain, never()).filter(any());
    }

    @Test
    @DisplayName("empty bearer token returns unauthorized")
    void filter_returnsUnauthorizedWhenBearerTokenEmpty() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/users")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer ")
                        .build()
        );

        when(jwtUtil.validateToken("")).thenReturn(false);

        filter.filter(exchange, chain).block();

        assertThat(exchange.getResponse().getStatusCode().value()).isEqualTo(401);
        verify(chain, never()).filter(any());
    }

    @Test
    @DisplayName("valid token forwards request with user email header")
    void filter_forwardsRequestWithUserEmailHeader() {
        CapturingGatewayFilterChain capturingChain = new CapturingGatewayFilterChain();
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/users")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer valid-token")
                        .build()
        );

        when(jwtUtil.validateToken("valid-token")).thenReturn(true);
        when(jwtUtil.getUserEmail("valid-token")).thenReturn("user@example.com");

        filter.filter(exchange, capturingChain).block();

        assertThat(capturingChain.capturedExchange).isNotNull();
        assertThat(
                capturingChain.capturedExchange.getRequest().getHeaders().getFirst(HeaderNames.USER_EMAIL)
        ).isEqualTo("user@example.com");
    }

    private static class CapturingGatewayFilterChain implements GatewayFilterChain {
        private org.springframework.web.server.ServerWebExchange capturedExchange;

        @Override
        public Mono<Void> filter(org.springframework.web.server.ServerWebExchange exchange) {
            this.capturedExchange = exchange;
            return Mono.empty();
        }
    }
}
