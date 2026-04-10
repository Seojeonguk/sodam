package com.sodam.common.logging;

import com.sodam.common.security.HeaderNames;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
public class RequestLoggingFilter extends OncePerRequestFilter {

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String requestUri = request.getRequestURI();
        return requestUri.startsWith("/actuator");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String correlationId = extractOrGenerateCorrelationId(request);
        long startTime = System.currentTimeMillis();

        response.setHeader(HeaderNames.CORRELATION_ID, correlationId);
        MDC.put(HeaderNames.MDC_CORRELATION_ID, correlationId);

        log.info("Incoming request. method={}, uri={}, query={}, clientIp={}",
                request.getMethod(), request.getRequestURI(), request.getQueryString(), request.getRemoteAddr());

        try {
            filterChain.doFilter(request, response);
        } finally {
            long durationMs = System.currentTimeMillis() - startTime;
            log.info("Completed request. method={}, uri={}, status={}, durationMs={}",
                    request.getMethod(), request.getRequestURI(), response.getStatus(), durationMs);
            MDC.remove(HeaderNames.MDC_CORRELATION_ID);
        }
    }

    private String extractOrGenerateCorrelationId(HttpServletRequest request) {
        String correlationId = request.getHeader(HeaderNames.CORRELATION_ID);
        if (correlationId == null || correlationId.isBlank()) {
            return CorrelationIdGenerator.generate();
        }

        return correlationId;
    }
}
