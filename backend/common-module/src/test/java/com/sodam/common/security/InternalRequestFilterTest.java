package com.sodam.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

class InternalRequestFilterTest {

    private final InternalRequestFilter filter =
            new InternalRequestFilter("shared-secret", new ObjectMapper());

    @Test
    @DisplayName("non internal paths bypass filter")
    void nonInternalPath_bypassesFilter() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/users");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(200);
    }

    @Test
    @DisplayName("internal request without service name returns unauthorized")
    void internalRequest_withoutServiceName_returnsUnauthorized() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/internal/users");
        request.addHeader(HeaderNames.INTERNAL_SERVICE_TOKEN, "shared-secret");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentAsString()).contains("E-00002");
    }

    @Test
    @DisplayName("internal request with blank service name returns unauthorized")
    void internalRequest_withBlankServiceName_returnsUnauthorized() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/internal/users");
        request.addHeader(HeaderNames.INTERNAL_SERVICE_NAME, "   ");
        request.addHeader(HeaderNames.INTERNAL_SERVICE_TOKEN, "shared-secret");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentAsString()).contains("E-00002");
    }

    @Test
    @DisplayName("internal request with wrong token returns forbidden")
    void internalRequest_withWrongToken_returnsForbidden() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/internal/users");
        request.addHeader(HeaderNames.INTERNAL_SERVICE_NAME, "user-service");
        request.addHeader(HeaderNames.INTERNAL_SERVICE_TOKEN, "wrong-token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentAsString()).contains("E-00003");
    }

    @Test
    @DisplayName("internal request with valid headers proceeds through filter chain")
    void internalRequest_withValidHeaders_proceeds() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/internal/users");
        request.addHeader(HeaderNames.INTERNAL_SERVICE_NAME, "user-service");
        request.addHeader(HeaderNames.INTERNAL_SERVICE_TOKEN, "shared-secret");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(chain.getRequest()).isSameAs(request);
    }

    @Test
    @DisplayName("internal request is forbidden when configured token is blank")
    void internalRequest_isForbiddenWhenConfiguredTokenBlank() throws Exception {
        InternalRequestFilter blankTokenFilter =
                new InternalRequestFilter("", new ObjectMapper());
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/internal/users");
        request.addHeader(HeaderNames.INTERNAL_SERVICE_NAME, "user-service");
        request.addHeader(HeaderNames.INTERNAL_SERVICE_TOKEN, "shared-secret");
        MockHttpServletResponse response = new MockHttpServletResponse();

        blankTokenFilter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentAsString()).contains("E-00003");
    }
}
