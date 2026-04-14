package com.sodam.transactionservice.application.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sodam.common.exception.GlobalExceptionHandler;
import com.sodam.common.security.CurrentUser;
import com.sodam.common.security.UserContext;
import com.sodam.transactionservice.application.api.dto.TransactionRequest;
import com.sodam.transactionservice.application.service.TransactionApplicationService;
import com.sodam.transactionservice.domain.model.TransactionType;
import java.math.BigDecimal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class TransactionControllerValidationTest {

    @Mock
    private TransactionApplicationService transactionApplicationService;

    @InjectMocks
    private TransactionController transactionController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("create transaction returns bad request when amount is zero")
    void createTransaction_returnsBadRequestWhenAmountIsZero() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        TransactionRequest request = TransactionRequest.builder()
                .accountBookSeq(10L)
                .categorySeq(20L)
                .amount(BigDecimal.ZERO)
                .transactionDate("20260414120000")
                .type(TransactionType.EXPENSE)
                .build();

        mockMvc.perform(post("/api/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("E-00001"))
                .andExpect(jsonPath("$.message").exists());

        verifyNoInteractions(transactionApplicationService);
    }

    @Test
    @DisplayName("create transaction returns bad request when type is missing")
    void createTransaction_returnsBadRequestWhenTypeMissing() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        TransactionRequest request = TransactionRequest.builder()
                .accountBookSeq(10L)
                .categorySeq(20L)
                .amount(BigDecimal.valueOf(5000))
                .transactionDate("20260414120000")
                .build();

        mockMvc.perform(post("/api/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("E-00001"))
                .andExpect(jsonPath("$.message").exists());

        verifyNoInteractions(transactionApplicationService);
    }

    @Test
    @DisplayName("create transaction returns bad request when amount is negative")
    void createTransaction_returnsBadRequestWhenAmountIsNegative() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        TransactionRequest request = TransactionRequest.builder()
                .accountBookSeq(10L)
                .categorySeq(20L)
                .amount(BigDecimal.valueOf(-10))
                .transactionDate("20260414120000")
                .type(TransactionType.EXPENSE)
                .build();

        mockMvc.perform(post("/api/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("E-00001"));

        verifyNoInteractions(transactionApplicationService);
    }

    @Test
    @DisplayName("create transaction returns bad request when satisfaction rating is below range")
    void createTransaction_returnsBadRequestWhenSatisfactionTooLow() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        TransactionRequest request = TransactionRequest.builder()
                .accountBookSeq(10L)
                .categorySeq(20L)
                .amount(BigDecimal.valueOf(1000))
                .transactionDate("20260414120000")
                .type(TransactionType.EXPENSE)
                .satisfactionRating(0)
                .build();

        mockMvc.perform(post("/api/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("E-00001"));

        verifyNoInteractions(transactionApplicationService);
    }

    @Test
    @DisplayName("create transaction returns bad request when satisfaction rating is above range")
    void createTransaction_returnsBadRequestWhenSatisfactionTooHigh() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        TransactionRequest request = TransactionRequest.builder()
                .accountBookSeq(10L)
                .categorySeq(20L)
                .amount(BigDecimal.valueOf(1000))
                .transactionDate("20260414120000")
                .type(TransactionType.EXPENSE)
                .satisfactionRating(6)
                .build();

        mockMvc.perform(post("/api/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("E-00001"));

        verifyNoInteractions(transactionApplicationService);
    }

    @Test
    @DisplayName("create transaction returns bad request when description is too long")
    void createTransaction_returnsBadRequestWhenDescriptionTooLong() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        TransactionRequest request = TransactionRequest.builder()
                .accountBookSeq(10L)
                .categorySeq(20L)
                .amount(BigDecimal.valueOf(1000))
                .description("a".repeat(256))
                .transactionDate("20260414120000")
                .type(TransactionType.EXPENSE)
                .build();

        mockMvc.perform(post("/api/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("E-00001"));

        verifyNoInteractions(transactionApplicationService);
    }

    private MockMvc buildMockMvc() {
        return MockMvcBuilders.standaloneSetup(transactionController)
                .setControllerAdvice(new GlobalExceptionHandler())
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
