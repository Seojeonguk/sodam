package com.sodam.common.config;

import feign.Logger;
import feign.Request;
import feign.RequestInterceptor;
import feign.Retryer;
import feign.codec.ErrorDecoder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import com.sodam.common.security.InternalServiceFeignInterceptor;

@Configuration
public class FeignConfig {

    @Bean
    Logger.Level feignLoggerLevel(Environment environment) {
        String configuredLevel = environment.getProperty("sodam.feign.logger-level");
        if (configuredLevel != null && !configuredLevel.isBlank()) {
            return Logger.Level.valueOf(configuredLevel.toUpperCase());
        }

        for (String profile : environment.getActiveProfiles()) {
            if ("local".equalsIgnoreCase(profile) || "dev".equalsIgnoreCase(profile)) {
                return Logger.Level.FULL;
            }
        }

        return Logger.Level.BASIC;
    }

    @Bean
    Request.Options feignRequestOptions(Environment environment) {
        int connectTimeoutMillis = environment.getProperty("sodam.feign.connect-timeout-ms", Integer.class, 3000);
        int readTimeoutMillis = environment.getProperty("sodam.feign.read-timeout-ms", Integer.class, 5000);
        return new Request.Options(connectTimeoutMillis, readTimeoutMillis);
    }

    @Bean
    Retryer feignRetryer(Environment environment) {
        long periodMillis = environment.getProperty("sodam.feign.retry.period-ms", Long.class, 200L);
        long maxPeriodMillis = environment.getProperty("sodam.feign.retry.max-period-ms", Long.class, 1000L);
        int maxAttempts = environment.getProperty("sodam.feign.retry.max-attempts", Integer.class, 2);

        if (maxAttempts <= 1) {
            return Retryer.NEVER_RETRY;
        }

        return new Retryer.Default(periodMillis, maxPeriodMillis, maxAttempts);
    }

    @Bean
    ErrorDecoder feignErrorDecoder() {
        return new CommonFeignErrorDecoder();
    }

    @Bean
    RequestInterceptor internalServiceFeignInterceptor(Environment environment, InternalServiceProperties properties) {
        String applicationName = environment.getProperty("spring.application.name", "unknown-service");
        return new InternalServiceFeignInterceptor(applicationName, properties.token());
    }
}
