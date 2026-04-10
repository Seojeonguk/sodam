package com.sodam.common.config;

import com.sodam.common.logging.ReactiveRequestLoggingFilter;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.server.WebFilter;

@AutoConfiguration
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.REACTIVE)
public class CommonReactiveLoggingAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean(name = "reactiveRequestLoggingFilter")
    public WebFilter reactiveRequestLoggingFilter() {
        return new ReactiveRequestLoggingFilter();
    }
}
