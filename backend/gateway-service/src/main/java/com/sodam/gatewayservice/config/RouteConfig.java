package com.sodam.gatewayservice.config;

import com.sodam.gatewayservice.filter.JwtAuthGatewayFilter;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RouteConfig {

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("user-service-no-filter", r -> r.path("/api/auth/login", "/api/auth/logout", "/api/auth/register")
                        .uri("lb://user-service"))
                .route("user-service-with-filter", r -> r.path("/api/auth/**")
                        .filters(f -> f.filter(new JwtAuthGatewayFilter()))
                        .uri("lb://user-service"))
                .route("transaction-service", r -> r.path("/api/transactions/**")
                        .uri("lb://transaction-service"))
                .build();
    }
}
