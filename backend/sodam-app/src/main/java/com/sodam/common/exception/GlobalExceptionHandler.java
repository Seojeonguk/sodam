package com.sodam.common.exception;

import com.sodam.common.response.ApiResponse;
import com.sodam.common.response.ResponseCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.BindException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.ObjectError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ApiResponse<Void>> handleCustomException(CustomException ex) {
        return buildErrorResponse(ex.getResponseCode(), ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgumentException(IllegalArgumentException ex) {
        return buildErrorResponse(ResponseCode.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler({
            MethodArgumentNotValidException.class,
            BindException.class,
            MissingServletRequestParameterException.class,
            MissingRequestHeaderException.class,
            MethodArgumentTypeMismatchException.class
    })
    public ResponseEntity<ApiResponse<Void>> handleBadRequestExceptions(Exception ex) {
        if (ex instanceof MethodArgumentNotValidException validationException) {
            return buildErrorResponse(ResponseCode.BAD_REQUEST, extractValidationMessage(validationException.getBindingResult()));
        }
        if (ex instanceof BindException bindException) {
            return buildErrorResponse(ResponseCode.BAD_REQUEST, extractValidationMessage(bindException.getBindingResult()));
        }
        if (ex instanceof MethodArgumentTypeMismatchException mismatchException) {
            String requiredType = mismatchException.getRequiredType() == null
                    ? "unknown" : mismatchException.getRequiredType().getSimpleName();
            return buildErrorResponse(ResponseCode.BAD_REQUEST,
                    "Validation failed: " + mismatchException.getName() + " must be of type " + requiredType);
        }
        return buildErrorResponse(ResponseCode.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthenticationException(AuthenticationException ex) {
        return buildErrorResponse(ResponseCode.UNAUTHORIZED, ex.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDeniedException(AccessDeniedException ex) {
        return buildErrorResponse(ResponseCode.FORBIDDEN, ex.getMessage());
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodNotAllowed(HttpRequestMethodNotSupportedException ex) {
        return buildErrorResponse(ResponseCode.METHOD_NOT_ALLOWED, ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception ex) {
        log.error("Unhandled Exception", ex);
        return buildErrorResponse(ResponseCode.INTERNAL_SERVER_ERROR, ResponseCode.INTERNAL_SERVER_ERROR.getMessage());
    }

    private ResponseEntity<ApiResponse<Void>> buildErrorResponse(ResponseCode code, String message) {
        String responseMessage = (message == null || message.isBlank()) ? code.getMessage() : message;
        return ResponseEntity.status(code.getStatus())
                .body(ApiResponse.fail(code.getCode(), responseMessage));
    }

    private String extractValidationMessage(BindingResult bindingResult) {
        List<String> messages = new ArrayList<>();
        bindingResult.getFieldErrors().forEach(fieldError -> messages.add(
                fieldError.getField() + ": " + Objects.toString(fieldError.getDefaultMessage(), "유효하지 않은 값입니다.")));
        for (ObjectError globalError : bindingResult.getGlobalErrors()) {
            messages.add(Objects.toString(globalError.getDefaultMessage(), "유효하지 않은 요청입니다."));
        }
        if (messages.isEmpty()) return ResponseCode.BAD_REQUEST.getMessage();
        return "Validation failed: " + String.join(", ", messages);
    }
}
