package com.sodam.transactionservice.application.api.controller;

import com.sodam.common.security.CurrentUser;
import com.sodam.common.security.UserContext;
import com.sodam.transactionservice.application.api.dto.StatPeriodResponse;
import com.sodam.transactionservice.application.api.dto.StatResponse;
import com.sodam.transactionservice.application.service.StatApplicationService;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class StatControllerTest {

    @Mock
    private StatApplicationService statApplicationService;

    @InjectMocks
    private StatController statController;

    @Test
    @DisplayName("getStat endpoint returns stat list")
    void getStat_returnsSuccessResponse() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        StatResponse response = new StatResponse();
        response.setName("food");
        response.setType("EXPENSE");
        response.setTotal(18000.0);

        when(statApplicationService.getStat(any(), eq("tester@example.com")))
                .thenReturn(List.of(response));

        mockMvc.perform(get("/api/stat")
                        .param("startDate", "20260401")
                        .param("endDate", "20260430"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("S-00000"))
                .andExpect(jsonPath("$.data[0].name").value("food"));
    }

    @Test
    @DisplayName("getPeriodStat endpoint returns period stat list")
    void getPeriodStat_returnsSuccessResponse() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        StatPeriodResponse response = new StatPeriodResponse();
        response.setType("INCOME");
        response.setTransaction_date("20260414");
        response.setTotal(30000.0);

        when(statApplicationService.getPeriodStat(any(), eq("tester@example.com")))
                .thenReturn(List.of(response));

        mockMvc.perform(get("/api/stat/period")
                        .param("startDate", "20260401")
                        .param("endDate", "20260430"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("S-00000"))
                .andExpect(jsonPath("$.data[0].type").value("INCOME"));
    }

    private MockMvc buildMockMvc() {
        return MockMvcBuilders.standaloneSetup(statController)
                .setCustomArgumentResolvers(new CurrentUserArgumentResolver())
                .build();
    }

    private static class CurrentUserArgumentResolver implements HandlerMethodArgumentResolver {
        @Override
        public boolean supportsParameter(MethodParameter parameter) {
            return parameter.hasParameterAnnotation(CurrentUser.class)
                    && parameter.getParameterType().equals(UserContext.class);
        }

        @Override
        public Object resolveArgument(
                MethodParameter parameter,
                ModelAndViewContainer mavContainer,
                NativeWebRequest webRequest,
                WebDataBinderFactory binderFactory
        ) {
            return UserContext.of("tester@example.com");
        }
    }
}
