package com.sodam.common.exception;

import com.sodam.common.response.ApiResponse;
import com.sodam.common.response.ResponseCode;
import feign.Request;
import feign.RequestTemplate;
import feign.FeignException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("custom exception maps to configured response code")
    void handleCustomException_returnsConfiguredResponse() {
        ResponseEntity<ApiResponse<Void>> response =
                handler.handleCustomException(new CustomException(ResponseCode.FORBIDDEN));

        assertThat(response.getStatusCode().value()).isEqualTo(403);
        assertThat(response.getBody().getCode()).isEqualTo("E-00003");
    }

    @Test
    @DisplayName("illegal argument exception maps to bad request")
    void handleIllegalArgumentException_returnsBadRequest() {
        ResponseEntity<ApiResponse<Void>> response =
                handler.handleIllegalArgumentException(new IllegalArgumentException("bad input"));

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody().getMessage()).isEqualTo("bad input");
    }

    @Test
    @DisplayName("validation exception extracts field messages")
    void handleBadRequestExceptions_extractsValidationMessages() {
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(new Object(), "request");
        bindingResult.addError(new FieldError("request", "amount", "must be positive"));

        MethodArgumentNotValidException exception =
                new MethodArgumentNotValidException(null, bindingResult);

        ResponseEntity<ApiResponse<Void>> response = handler.handleBadRequestExceptions(exception);

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody().getMessage()).contains("amount");
        assertThat(response.getBody().getMessage()).contains("must be positive");
    }

    @Test
    @DisplayName("type mismatch exception includes required type")
    void handleBadRequestExceptions_handlesTypeMismatch() {
        MethodArgumentTypeMismatchException exception = new MethodArgumentTypeMismatchException(
                "abc",
                Long.class,
                "id",
                null,
                new IllegalArgumentException("bad type")
        );

        ResponseEntity<ApiResponse<Void>> response = handler.handleBadRequestExceptions(exception);

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody().getMessage()).contains("id");
        assertThat(response.getBody().getMessage()).contains("Long");
    }

    @Test
    @DisplayName("authentication exception maps to unauthorized")
    void handleAuthenticationException_returnsUnauthorized() {
        AuthenticationException exception = new AuthenticationException("auth failed") { };

        ResponseEntity<ApiResponse<Void>> response = handler.handleAuthenticationException(exception);

        assertThat(response.getStatusCode().value()).isEqualTo(401);
        assertThat(response.getBody().getMessage()).isEqualTo("auth failed");
    }

    @Test
    @DisplayName("access denied exception maps to forbidden")
    void handleAccessDeniedException_returnsForbidden() {
        ResponseEntity<ApiResponse<Void>> response =
                handler.handleAccessDeniedException(new AccessDeniedException("forbidden"));

        assertThat(response.getStatusCode().value()).isEqualTo(403);
        assertThat(response.getBody().getMessage()).isEqualTo("forbidden");
    }

    @Test
    @DisplayName("feign exception maps to bad gateway")
    void handleFeignException_returnsBadGateway() {
        FeignException exception = FeignException.errorStatus(
                "UserClient#getUser",
                feign.Response.builder()
                        .status(503)
                        .reason("Service Unavailable")
                        .request(Request.create(
                                Request.HttpMethod.GET,
                                "http://localhost/users",
                                java.util.Map.of(),
                                null,
                                StandardCharsets.UTF_8,
                                new RequestTemplate()
                        ))
                        .build()
        );

        ResponseEntity<ApiResponse<Void>> response = handler.handleFeignException(exception);

        assertThat(response.getStatusCode().value()).isEqualTo(502);
        assertThat(response.getBody().getCode()).isEqualTo("E-00006");
    }

    @Test
    @DisplayName("unexpected exception maps to internal server error")
    void handleException_returnsInternalServerError() {
        ResponseEntity<ApiResponse<Void>> response =
                handler.handleException(new RuntimeException("boom"));

        assertThat(response.getStatusCode().value()).isEqualTo(500);
        assertThat(response.getBody().getCode()).isEqualTo("E-00000");
    }
}
