package com.sodam.userservice.common.api;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@Getter
public class ApiResponse<T> {

    private final String code;
    private final String message;
    private final T data;

    private ApiResponse(String code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    public static <T> ResponseEntity<ApiResponse<T>> success(String message, T data) {
        ApiResponse<T> response = new ApiResponse<>(ResponseCode.SUCCESS.getCode(), message, data);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    public static <T> ResponseEntity<ApiResponse<T>> success(T data) {
        ApiResponse<T> response = new ApiResponse<>(ResponseCode.SUCCESS.getCode(), ResponseCode.SUCCESS.getMessage(), data);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    // 3. 성공 (데이터 없음)
    public static <T> ResponseEntity<ApiResponse<T>> success() {
        return success(null);
    }

    public static <T> ResponseEntity<ApiResponse<T>> success(String message) {
        return success(message, null);
    }

    // 5. 실패 (ResponseCode와 커스텀 메시지 사용)
    public static <T> ResponseEntity<ApiResponse<T>> failure(String code, String message) {
        ApiResponse<T> response = new ApiResponse<>(code, message, null);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}