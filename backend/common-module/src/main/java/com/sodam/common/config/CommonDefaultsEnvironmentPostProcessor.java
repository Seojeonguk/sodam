package com.sodam.common.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

public class CommonDefaultsEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final String PROPERTY_SOURCE_NAME = "sodamCommonDefaults";
    private static final String LOG_PATTERN =
            "%5p [${spring.application.name}, traceId=%X{traceId:-}, spanId=%X{spanId:-}, correlationId=%X{correlationId:-}]";
    private static final Set<String> FULL_LOG_PROFILES = Set.of("local", "dev");

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Map<String, Object> defaults = new LinkedHashMap<>();

        putIfMissing(environment, defaults, "logging.pattern.level", LOG_PATTERN);
        putIfMissing(environment, defaults, "sodam.feign.connect-timeout-ms", "3000");
        putIfMissing(environment, defaults, "sodam.feign.read-timeout-ms", "5000");
        putIfMissing(environment, defaults, "sodam.feign.retry.period-ms", "200");
        putIfMissing(environment, defaults, "sodam.feign.retry.max-period-ms", "1000");
        putIfMissing(environment, defaults, "sodam.feign.retry.max-attempts", isProdProfile(environment) ? "1" : "2");
        putIfMissing(environment, defaults, "sodam.feign.logger-level", isVerboseProfile(environment) ? "FULL" : "BASIC");
        putIfMissing(environment, defaults, "internal.service.token", InternalServiceProperties.DEFAULT_TOKEN);
        putIfMissing(environment, defaults, "management.tracing.sampling.probability", isVerboseProfile(environment) ? "1.0" : "0.1");

        if (!defaults.isEmpty()) {
            environment.getPropertySources().addLast(new MapPropertySource(PROPERTY_SOURCE_NAME, defaults));
        }
    }

    private void putIfMissing(ConfigurableEnvironment environment, Map<String, Object> defaults, String key, String value) {
        if (!environment.containsProperty(key)) {
            defaults.put(key, value);
        }
    }

    private boolean isVerboseProfile(ConfigurableEnvironment environment) {
        for (String profile : environment.getActiveProfiles()) {
            if (FULL_LOG_PROFILES.contains(profile)) {
                return true;
            }
        }

        return false;
    }

    private boolean isProdProfile(ConfigurableEnvironment environment) {
        for (String profile : environment.getActiveProfiles()) {
            if ("prod".equalsIgnoreCase(profile)) {
                return true;
            }
        }

        return false;
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
