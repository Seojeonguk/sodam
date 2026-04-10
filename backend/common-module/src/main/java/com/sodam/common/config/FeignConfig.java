package com.sodam.common.config;

import feign.Logger;
import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import com.sodam.common.security.InternalServiceFeignInterceptor;

@Configuration
public class FeignConfig {

    @Bean
    Logger.Level feignLoggerLevel() {
        return Logger.Level.FULL;
    }

    @Bean
    RequestInterceptor internalServiceFeignInterceptor(Environment environment, InternalServiceProperties properties) {
        String applicationName = environment.getProperty("spring.application.name", "unknown-service");
        return new InternalServiceFeignInterceptor(applicationName, properties.tokenOrDefault());
    }
}
