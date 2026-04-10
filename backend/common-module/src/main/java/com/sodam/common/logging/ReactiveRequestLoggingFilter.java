package com.sodam.common.logging;

import com.sodam.common.security.HeaderNames;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

@Slf4j
public class ReactiveRequestLoggingFilter implements WebFilter {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        if (exchange.getRequest().getPath().value().startsWith("/actuator")) {
            return chain.filter(exchange);
        }

        String correlationId = extractOrGenerateCorrelationId(exchange);
        long startTime = System.currentTimeMillis();

        ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                .header(HeaderNames.CORRELATION_ID, correlationId)
                .build();

        exchange.getResponse().getHeaders().set(HeaderNames.CORRELATION_ID, correlationId);

        log.info("Incoming reactive request. method={}, uri={}, query={}, correlationId={}",
                mutatedRequest.getMethod(), mutatedRequest.getPath(), mutatedRequest.getURI().getQuery(), correlationId);

        return chain.filter(exchange.mutate().request(mutatedRequest).build())
                .doFinally(signalType -> {
                    long durationMs = System.currentTimeMillis() - startTime;
                    log.info("Completed reactive request. method={}, uri={}, status={}, durationMs={}, correlationId={}",
                            mutatedRequest.getMethod(),
                            mutatedRequest.getPath(),
                            exchange.getResponse().getStatusCode(),
                            durationMs,
                            correlationId);
                });
    }

    private String extractOrGenerateCorrelationId(ServerWebExchange exchange) {
        String correlationId = exchange.getRequest().getHeaders().getFirst(HeaderNames.CORRELATION_ID);
        if (correlationId == null || correlationId.isBlank()) {
            return CorrelationIdGenerator.generate();
        }

        return correlationId;
    }
}
