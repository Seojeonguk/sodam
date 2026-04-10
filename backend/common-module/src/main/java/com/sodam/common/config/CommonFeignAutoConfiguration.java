package com.sodam.common.config;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Import;

@AutoConfiguration
@EnableConfigurationProperties(InternalServiceProperties.class)
@Import(FeignConfig.class)
public class CommonFeignAutoConfiguration {
}
