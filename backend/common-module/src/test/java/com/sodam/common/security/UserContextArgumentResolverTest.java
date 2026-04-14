package com.sodam.common.security;

import java.lang.reflect.Method;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.context.request.ServletWebRequest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class UserContextArgumentResolverTest {

    private final UserContextArgumentResolver resolver = new UserContextArgumentResolver();

    @Test
    @DisplayName("supportsParameter returns true for CurrentUser UserContext")
    void supportsParameter_returnsTrueForAnnotatedUserContext() throws Exception {
        Method method = TestController.class.getDeclaredMethod("required", UserContext.class);
        MethodParameter parameter = new MethodParameter(method, 0);

        assertThat(resolver.supportsParameter(parameter)).isTrue();
    }

    @Test
    @DisplayName("resolveArgument returns user context when email header exists")
    void resolveArgument_returnsUserContext() throws Exception {
        Method method = TestController.class.getDeclaredMethod("required", UserContext.class);
        MethodParameter parameter = new MethodParameter(method, 0);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(HeaderNames.USER_EMAIL, "user@example.com");

        Object resolved = resolver.resolveArgument(
                parameter,
                null,
                new ServletWebRequest(request),
                null
        );

        assertThat(resolved).isEqualTo(UserContext.of("user@example.com"));
    }

    @Test
    @DisplayName("resolveArgument throws when required header is missing")
    void resolveArgument_throwsWhenRequiredHeaderMissing() throws Exception {
        Method method = TestController.class.getDeclaredMethod("required", UserContext.class);
        MethodParameter parameter = new MethodParameter(method, 0);
        MockHttpServletRequest request = new MockHttpServletRequest();

        assertThatThrownBy(() -> resolver.resolveArgument(
                parameter,
                null,
                new ServletWebRequest(request),
                null
        )).isInstanceOf(MissingRequestHeaderException.class);
    }

    @Test
    @DisplayName("resolveArgument allows missing header when required is false")
    void resolveArgument_allowsMissingHeaderWhenOptional() throws Exception {
        Method method = TestController.class.getDeclaredMethod("optional", UserContext.class);
        MethodParameter parameter = new MethodParameter(method, 0);
        MockHttpServletRequest request = new MockHttpServletRequest();

        Object resolved = resolver.resolveArgument(
                parameter,
                null,
                new ServletWebRequest(request),
                null
        );

        assertThat(resolved).isEqualTo(UserContext.of(null));
    }

    @Test
    @DisplayName("resolveArgument throws when required header is blank")
    void resolveArgument_throwsWhenRequiredHeaderBlank() throws Exception {
        Method method = TestController.class.getDeclaredMethod("required", UserContext.class);
        MethodParameter parameter = new MethodParameter(method, 0);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(HeaderNames.USER_EMAIL, "   ");

        assertThatThrownBy(() -> resolver.resolveArgument(
                parameter,
                null,
                new ServletWebRequest(request),
                null
        )).isInstanceOf(MissingRequestHeaderException.class);
    }

    private static class TestController {
        void required(@CurrentUser UserContext userContext) {
        }

        void optional(@CurrentUser(required = false) UserContext userContext) {
        }
    }
}
