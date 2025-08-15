package com.sodam.gatewayservice.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RouteConfig {

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("user-service", r -> r.path("/api/auth/**")
                        .uri("lb://user-service"))
                .route("transaction-service", r -> r.path("/api/transactions/**")
                        .uri("lb://transaction-service"))
                .build();
    }
}
