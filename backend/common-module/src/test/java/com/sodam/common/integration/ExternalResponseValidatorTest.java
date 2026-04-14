package com.sodam.common.integration;

import com.sodam.common.exception.CustomException;
import com.sodam.common.response.ApiResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ExternalResponseValidatorTest {

    @Test
    @DisplayName("requireData returns data when response is valid")
    void requireData_returnsData() {
        String data = ExternalResponseValidator.requireData(ApiResponse.success("ok"), "user-service");

        assertThat(data).isEqualTo("ok");
    }

    @Test
    @DisplayName("requireData throws custom exception when response is null")
    void requireData_throwsWhenResponseIsNull() {
        assertThatThrownBy(() -> ExternalResponseValidator.requireData(null, "user-service"))
                .isInstanceOf(CustomException.class)
                .hasMessageContaining("response is missing");
    }

    @Test
    @DisplayName("requireField throws custom exception when field is null")
    void requireField_throwsWhenFieldIsNull() {
        TestPayload payload = new TestPayload(null);

        assertThatThrownBy(() ->
                ExternalResponseValidator.requireField(payload, TestPayload::value, "user-service", "user id"))
                .isInstanceOf(CustomException.class)
                .hasMessageContaining("user id");
    }

    private record TestPayload(Long value) {
    }
}
