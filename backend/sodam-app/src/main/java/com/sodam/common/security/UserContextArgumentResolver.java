package com.sodam.common.security;

import com.sodam.user.service.UserApplicationService;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.MethodParameter;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

public class UserContextArgumentResolver implements HandlerMethodArgumentResolver {

    private final UserApplicationService userApplicationService;

    public UserContextArgumentResolver(@Lazy UserApplicationService userApplicationService) {
        this.userApplicationService = userApplicationService;
    }

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(CurrentUser.class)
                && UserContext.class.isAssignableFrom(parameter.getParameterType());
    }

    @Override
    public Object resolveArgument(
            MethodParameter parameter,
            ModelAndViewContainer mavContainer,
            NativeWebRequest webRequest,
            WebDataBinderFactory binderFactory
    ) throws Exception {
        CurrentUser annotation = parameter.getParameterAnnotation(CurrentUser.class);
        String email = webRequest.getHeader(HeaderNames.USER_EMAIL);
        String name  = webRequest.getHeader(HeaderNames.USER_NAME);

        if (annotation != null && annotation.required() && (email == null || email.isBlank())) {
            throw new MissingRequestHeaderException(HeaderNames.USER_EMAIL, parameter);
        }

        if (email != null && !email.isBlank()) {
            // DB에 없는 신규 사용자라면 자동 생성 (Supabase 최초 로그인 시)
            userApplicationService.syncUser(email, name);
        }

        return UserContext.of(email);
    }
}
