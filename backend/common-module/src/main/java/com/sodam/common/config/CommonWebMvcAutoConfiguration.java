package com.sodam.common.config;

import com.sodam.common.security.UserContextArgumentResolver;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

@AutoConfiguration
public class CommonWebMvcAutoConfiguration implements WebMvcConfigurer {

    @Bean
    public UserContextArgumentResolver userContextArgumentResolver() {
        return new UserContextArgumentResolver();
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(userContextArgumentResolver());
    }
}
