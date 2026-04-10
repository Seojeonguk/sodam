package com.sodam.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sodam.common.response.ApiResponse;
import com.sodam.common.response.ResponseCode;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class InternalRequestFilter extends OncePerRequestFilter {

    private final String internalServiceToken;
    private final ObjectMapper objectMapper;

    public InternalRequestFilter(String internalServiceToken, ObjectMapper objectMapper) {
        this.internalServiceToken = internalServiceToken;
        this.objectMapper = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/internal/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String serviceName = request.getHeader(HeaderNames.INTERNAL_SERVICE_NAME);
        String serviceToken = request.getHeader(HeaderNames.INTERNAL_SERVICE_TOKEN);

        if (serviceName == null || serviceName.isBlank()) {
            writeErrorResponse(response, ResponseCode.UNAUTHORIZED, "내부 서비스 호출 헤더가 없습니다.");
            return;
        }

        if (internalServiceToken == null || internalServiceToken.isBlank() || !internalServiceToken.equals(serviceToken)) {
            writeErrorResponse(response, ResponseCode.FORBIDDEN, "내부 서비스 인증에 실패했습니다.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void writeErrorResponse(HttpServletResponse response, ResponseCode code, String message) throws IOException {
        response.setStatus(code.getStatus());
        response.setCharacterEncoding("UTF-8");
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(ApiResponse.fail(code.getCode(), message)));
    }
}
