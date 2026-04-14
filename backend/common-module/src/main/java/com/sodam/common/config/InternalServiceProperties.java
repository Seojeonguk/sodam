package com.sodam.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "internal.service")
public record InternalServiceProperties(String token) {

    public boolean isConfigured() {
        return token != null && !token.isBlank();
    }
}
