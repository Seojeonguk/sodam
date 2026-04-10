package com.sodam.common.config;

import feign.Request;
import feign.Response;
import feign.RetryableException;
import feign.codec.ErrorDecoder;
import lombok.extern.slf4j.Slf4j;

import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Slf4j
public class CommonFeignErrorDecoder implements ErrorDecoder {

    private static final List<Integer> RETRYABLE_STATUS_CODES = List.of(429, 502, 503, 504);

    private final ErrorDecoder defaultErrorDecoder = new Default();

    @Override
    public Exception decode(String methodKey, Response response) {
        Exception defaultException = defaultErrorDecoder.decode(methodKey, response);

        log.warn("Feign call failed. methodKey={}, status={}, reason={}",
                methodKey, response.status(), response.reason());

        if (isRetryable(response)) {
            return new RetryableException(
                    response.status(),
                    defaultException.getMessage(),
                    response.request().httpMethod(),
                    defaultException,
                    extractRetryAfter(response.headers()),
                    response.request()
            );
        }

        return defaultException;
    }

    private boolean isRetryable(Response response) {
        Request.HttpMethod httpMethod = response.request().httpMethod();
        return RETRYABLE_STATUS_CODES.contains(response.status())
                && (httpMethod == Request.HttpMethod.GET || httpMethod == Request.HttpMethod.HEAD);
    }

    private Date extractRetryAfter(Map<String, Collection<String>> headers) {
        Collection<String> retryAfterValues = headers.get("Retry-After");
        if (retryAfterValues == null || retryAfterValues.isEmpty()) {
            return null;
        }

        try {
            long retryAfterSeconds = Long.parseLong(retryAfterValues.iterator().next());
            return new Date(System.currentTimeMillis() + retryAfterSeconds * 1000);
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
