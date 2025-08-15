package com.sodam.userservice.common.exception;

import com.sodam.userservice.common.api.ApiResponse;
import com.sodam.userservice.common.api.ResponseCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgumentException(IllegalArgumentException ex) {
        return ApiResponse.failure(ResponseCode.BAD_REQUEST.getCode(), ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception ex) {
        return ApiResponse.failure(ResponseCode.INTERNAL_SERVER_ERROR.getCode(), ex.getMessage());
    }
}