package com.sodam.gatewayservice.config;

import com.sodam.gatewayservice.filter.JwtAuthGatewayFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class RouteConfig {

    private final JwtAuthGatewayFilter jwtAuthGatewayFilter;

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("user-service-no-filter", r -> r.path("/api/auth/login", "/api/auth/logout", "/api/auth/register", "/oauth2/authorization/**", "login/oauth2/**")
                        .uri("lb://user-service"))
                .route("user-service-with-filter", r -> r.path("/api/auth/**")
                        .filters(f -> f.filter(jwtAuthGatewayFilter))
                        .uri("lb://user-service"))
                .route("transaction-service", r -> r.path("/api/transactions/**")
                        .filters(f -> f.filter(jwtAuthGatewayFilter))
                        .uri("lb://transaction-service"))
                .route("category-service", r->r.path("/api/categories/**")
                        .filters(f -> f.filter(jwtAuthGatewayFilter))
                        .uri("lb://category-service"))
                .build();
    }
}
