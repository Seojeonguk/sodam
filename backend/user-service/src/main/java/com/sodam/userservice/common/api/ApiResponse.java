package com.sodam.userservice.common.api;

import lombok.Getter;
import org.springframework.http.ResponseEntity;

@Getter
public class ApiResponse<T> {

    private final int code;
    private final String message;
    private final T data;

    private ApiResponse(int code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    public static <T> ResponseEntity<ApiResponse<T>> success(String message, T data) {
        ApiResponse<T> response = new ApiResponse<>(ResponseCode.SUCCESS.getHttpStatus().value(), message, data);
        return ResponseEntity.status(ResponseCode.SUCCESS.getHttpStatus()).body(response);
    }

    public static <T> ResponseEntity<ApiResponse<T>> success(T data) {
        ApiResponse<T> response = new ApiResponse<>(ResponseCode.SUCCESS.getHttpStatus().value(), ResponseCode.SUCCESS.getMessage(), data);
        return ResponseEntity.status(ResponseCode.SUCCESS.getHttpStatus()).body(response);
    }

    // 3. 성공 (데이터 없음)
    public static <T> ResponseEntity<ApiResponse<T>> success() {
        return success(null);
    }

    public static <T> ResponseEntity<ApiResponse<T>> success(String message) {
        return success(message, null);
    }

    // 4. 실패 (ResponseCode 사용)
    public static <T> ResponseEntity<ApiResponse<T>> failure(ResponseCode responseCode) {
        ApiResponse<T> response = new ApiResponse<>(responseCode.getHttpStatus().value(), responseCode.getMessage(), null);
        return ResponseEntity.status(responseCode.getHttpStatus()).body(response);
    }

    // 5. 실패 (ResponseCode와 커스텀 메시지 사용)
    public static <T> ResponseEntity<ApiResponse<T>> failure(ResponseCode responseCode, String message) {
        ApiResponse<T> response = new ApiResponse<>(responseCode.getHttpStatus().value(), message, null);
        return ResponseEntity.status(responseCode.getHttpStatus()).body(response);
    }
}