package com.sodam.common.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.ToString;

@AllArgsConstructor
@Getter
@ToString
public class ApiResponse<T> {
    private String code;
    private String message;
    private T data;

    public static <T> ApiResponse<T> success(String msg, T data) {
        return new ApiResponse<>("S-00000", msg, data);
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>("S-00000", "성공", data);
    }

    public static <T> ApiResponse<T> fail(String code, String message, T data) {
        return new ApiResponse<>(code, message, data);
    }

    public static <T> ApiResponse<T> fail(String code, String message) {
        return new ApiResponse<>(code, message, null);
    }

    public static <T> ApiResponse<T> fail(String message, T data) {
        return new ApiResponse<>("E-00000", message, data);
    }

    public static <T> ApiResponse<T> fail(T data) {
        return new ApiResponse<>("E-00000", "실패", data);
    }

    public static <T> ApiResponse<T> success() {
        return new ApiResponse<>("S-00000", "성공", null);
    }
}
