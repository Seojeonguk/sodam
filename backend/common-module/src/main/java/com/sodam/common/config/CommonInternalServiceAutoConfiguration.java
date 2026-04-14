package com.sodam.common.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sodam.common.security.InternalRequestFilter;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.core.Ordered;

@AutoConfiguration
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
@EnableConfigurationProperties(InternalServiceProperties.class)
public class CommonInternalServiceAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean(InternalRequestFilter.class)
    public FilterRegistrationBean<InternalRequestFilter> internalRequestFilter(
            InternalServiceProperties properties,
            ObjectMapper objectMapper
    ) {
        FilterRegistrationBean<InternalRequestFilter> registrationBean = new FilterRegistrationBean<>();
        registrationBean.setFilter(new InternalRequestFilter(properties.token(), objectMapper));
        registrationBean.addUrlPatterns("/internal/*");
        registrationBean.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return registrationBean;
    }
}
