package com.sodam.common.security;

public final class HeaderNames {

    public static final String USER_EMAIL = "X-User-Email";
    public static final String INTERNAL_SERVICE_NAME = "X-Internal-Service";
    public static final String INTERNAL_SERVICE_TOKEN = "X-Internal-Token";
    public static final String CORRELATION_ID = "X-Correlation-Id";
    public static final String MDC_CORRELATION_ID = "correlationId";

    private HeaderNames() {
    }
}
