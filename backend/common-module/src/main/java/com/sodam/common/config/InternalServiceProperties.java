package com.sodam.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "internal.service")
public record InternalServiceProperties(String token) {

    public static final String DEFAULT_TOKEN = "sodam-internal-token";

    public String tokenOrDefault() {
        return token == null || token.isBlank() ? DEFAULT_TOKEN : token;
    }
}
