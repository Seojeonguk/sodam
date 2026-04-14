package com.sodam.common.config;

import feign.Request;
import feign.Response;
import feign.RetryableException;
import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CommonFeignErrorDecoderTest {

    private final CommonFeignErrorDecoder decoder = new CommonFeignErrorDecoder();

    @Test
    @DisplayName("decode returns RetryableException for retryable GET status")
    void decode_returnsRetryableExceptionForRetryableGetRequest() {
        Response response = response(503, Request.HttpMethod.GET, Map.of("Retry-After", List.of("5")));

        Exception exception = decoder.decode("UserClient#getUser", response);

        assertThat(exception).isInstanceOf(RetryableException.class);
        RetryableException retryableException = (RetryableException) exception;
        assertThat(retryableException.status()).isEqualTo(503);
        assertThat(retryableException.retryAfter()).isNotNull();
    }

    @Test
    @DisplayName("decode returns default exception for non retryable POST status")
    void decode_returnsDefaultExceptionForPostRequest() {
        Response response = response(503, Request.HttpMethod.POST, Map.of());

        Exception exception = decoder.decode("UserClient#createUser", response);

        assertThat(exception).isNotInstanceOf(RetryableException.class);
    }

    @Test
    @DisplayName("decode ignores malformed Retry-After header")
    void decode_ignoresMalformedRetryAfterHeader() {
        Response response = response(503, Request.HttpMethod.GET, Map.of("Retry-After", List.of("abc")));

        Exception exception = decoder.decode("UserClient#getUser", response);

        assertThat(exception).isInstanceOf(RetryableException.class);
        assertThat(((RetryableException) exception).retryAfter()).isNull();
    }

    @Test
    @DisplayName("decode treats HEAD 429 as retryable")
    void decode_returnsRetryableExceptionForHeadTooManyRequests() {
        Response response = response(429, Request.HttpMethod.HEAD, Map.of());

        Exception exception = decoder.decode("UserClient#headUser", response);

        assertThat(exception).isInstanceOf(RetryableException.class);
        assertThat(((RetryableException) exception).status()).isEqualTo(429);
    }

    @Test
    @DisplayName("decode does not retry non retryable status code")
    void decode_returnsDefaultExceptionForNonRetryableStatus() {
        Response response = response(404, Request.HttpMethod.GET, Map.of());

        Exception exception = decoder.decode("UserClient#getUser", response);

        assertThat(exception).isNotInstanceOf(RetryableException.class);
    }

    @Test
    @DisplayName("decode returns RetryableException for gateway timeout GET status")
    void decode_returnsRetryableExceptionForGatewayTimeoutGetRequest() {
        Response response = response(504, Request.HttpMethod.GET, Map.of());

        Exception exception = decoder.decode("UserClient#getUser", response);

        assertThat(exception).isInstanceOf(RetryableException.class);
        assertThat(((RetryableException) exception).retryAfter()).isNull();
    }

    @Test
    @DisplayName("decode preserves feign default behavior for bad gateway POST request")
    void decode_preservesDefaultBehaviorForBadGatewayPostRequest() {
        Response response = response(502, Request.HttpMethod.POST, Map.of("Retry-After", List.of("5")));

        Exception exception = decoder.decode("UserClient#createUser", response);

        assertThat(exception).isInstanceOf(RetryableException.class);
        assertThat(((RetryableException) exception).status()).isEqualTo(502);
    }

    private Response response(
            int status,
            Request.HttpMethod method,
            Map<String, Collection<String>> headers
    ) {
        Request request = Request.create(
                method,
                "http://localhost/test",
                Map.of(),
                null,
                StandardCharsets.UTF_8,
                null
        );

        return Response.builder()
                .status(status)
                .reason("error")
                .request(request)
                .headers(headers)
                .build();
    }
}
