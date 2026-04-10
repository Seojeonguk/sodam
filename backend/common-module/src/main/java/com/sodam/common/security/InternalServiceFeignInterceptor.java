package com.sodam.common.security;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.List;

public class InternalServiceFeignInterceptor implements RequestInterceptor {

    private static final List<String> PROPAGATED_HEADERS = List.of(
            "traceparent",
            "b3",
            "X-B3-TraceId",
            "X-B3-SpanId",
            "X-B3-ParentSpanId",
            "X-B3-Sampled",
            "X-B3-Flags",
            HeaderNames.CORRELATION_ID
    );

    private final String applicationName;
    private final String internalServiceToken;

    public InternalServiceFeignInterceptor(String applicationName, String internalServiceToken) {
        this.applicationName = applicationName;
        this.internalServiceToken = internalServiceToken;
    }

    @Override
    public void apply(RequestTemplate template) {
        template.header(HeaderNames.INTERNAL_SERVICE_NAME, applicationName);

        if (internalServiceToken != null && !internalServiceToken.isBlank()) {
            template.header(HeaderNames.INTERNAL_SERVICE_TOKEN, internalServiceToken);
        }

        RequestAttributes requestAttributes = RequestContextHolder.getRequestAttributes();
        if (!(requestAttributes instanceof ServletRequestAttributes servletRequestAttributes)) {
            return;
        }

        HttpServletRequest request = servletRequestAttributes.getRequest();
        for (String headerName : PROPAGATED_HEADERS) {
            String headerValue = request.getHeader(headerName);
            if (headerValue != null && !headerValue.isBlank()) {
                template.header(headerName, headerValue);
            }
        }
    }
}
