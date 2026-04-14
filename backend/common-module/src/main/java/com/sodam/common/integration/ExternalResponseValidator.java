package com.sodam.common.integration;

import com.sodam.common.exception.CustomException;
import com.sodam.common.response.ApiResponse;
import com.sodam.common.response.ResponseCode;

import java.util.function.Function;

public final class ExternalResponseValidator {

    private ExternalResponseValidator() {
    }

    public static <T> T requireData(ApiResponse<T> response, String serviceName) {
        if (response == null) {
            throw invalidResponse(serviceName, "response is missing");
        }

        if (response.getData() == null) {
            throw invalidResponse(serviceName, "response data is missing");
        }

        return response.getData();
    }

    public static <T, R> R requireField(T data, Function<T, R> extractor, String serviceName, String fieldName) {
        if (data == null) {
            throw invalidResponse(serviceName, "response data is missing");
        }

        R value = extractor.apply(data);
        if (value == null) {
            throw invalidResponse(serviceName, fieldName + " is missing");
        }

        return value;
    }

    public static CustomException invalidResponse(String serviceName, String detail) {
        return new CustomException(
                ResponseCode.BAD_GATEWAY,
                "Failed to process response from " + serviceName + ": " + detail
        );
    }
}
