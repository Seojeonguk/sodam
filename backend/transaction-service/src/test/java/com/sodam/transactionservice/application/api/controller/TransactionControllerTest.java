package com.sodam.transactionservice.application.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sodam.common.security.CurrentUser;
import com.sodam.common.security.UserContext;
import com.sodam.transactionservice.application.api.dto.TransactionListResponse;
import com.sodam.transactionservice.application.api.dto.TransactionRequest;
import com.sodam.transactionservice.application.service.TransactionApplicationService;
import com.sodam.transactionservice.domain.model.Transaction;
import com.sodam.transactionservice.domain.model.TransactionType;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class TransactionControllerTest {

    @Mock
    private TransactionApplicationService transactionApplicationService;

    @InjectMocks
    private TransactionController transactionController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("create transaction endpoint returns created response")
    void createTransaction_returnsCreatedResponse() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        TransactionRequest request = TransactionRequest.builder()
                .accountBookSeq(10L)
                .categorySeq(20L)
                .amount(BigDecimal.valueOf(10000))
                .transactionDate("20260414120000")
                .type(TransactionType.EXPENSE)
                .build();

        Transaction transaction = Transaction.builder()
                .accountBookSeq(10L)
                .userSeq(1L)
                .categorySeq(20L)
                .amount(BigDecimal.valueOf(10000))
                .transactionDate("20260414120000")
                .type(TransactionType.EXPENSE)
                .build();
        ReflectionTestUtils.setField(transaction, "seq", 77L);

        when(transactionApplicationService.createTransaction(any(TransactionRequest.class), eq("tester@example.com")))
                .thenReturn(transaction);

        mockMvc.perform(post("/api/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value("S-00000"))
                .andExpect(jsonPath("$.data.seq").value(77L));
    }

    @Test
    @DisplayName("get transactions endpoint returns success response")
    void getTransactions_returnsSuccessResponse() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        TransactionListResponse response = TransactionListResponse.builder()
                .transactions(List.of())
                .pageNumber(0)
                .pageSize(20)
                .totalElements(0)
                .totalPages(0)
                .build();

        when(transactionApplicationService.getTransactions(any(), any(Pageable.class), eq("tester@example.com")))
                .thenReturn(response);

        mockMvc.perform(get("/api/transactions")
                        .param("accountBookSeq", "10")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("S-00000"))
                .andExpect(jsonPath("$.data.pageSize").value(20));
    }

    @Test
    @DisplayName("get transaction by id endpoint returns success response")
    void getTransactionById_returnsSuccessResponse() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        Transaction transaction = Transaction.builder()
                .accountBookSeq(10L)
                .userSeq(1L)
                .categorySeq(20L)
                .amount(BigDecimal.valueOf(10000))
                .transactionDate("20260414120000")
                .type(TransactionType.EXPENSE)
                .build();
        ReflectionTestUtils.setField(transaction, "seq", 88L);

        when(transactionApplicationService.getTransactionById(88L)).thenReturn(transaction);

        mockMvc.perform(get("/api/transactions/88"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("S-00000"))
                .andExpect(jsonPath("$.data.seq").value(88L));
    }

    @Test
    @DisplayName("delete transaction endpoint returns success response")
    void deleteTransaction_returnsSuccessResponse() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        mockMvc.perform(delete("/api/transactions/55"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("S-00000"));
    }

    @Test
    @DisplayName("update transaction endpoint returns success response")
    void updateTransaction_returnsSuccessResponse() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        TransactionRequest request = TransactionRequest.builder()
                .accountBookSeq(10L)
                .categorySeq(22L)
                .amount(BigDecimal.valueOf(23000))
                .transactionDate("20260415120000")
                .type(TransactionType.INCOME)
                .build();

        Transaction updated = Transaction.builder()
                .accountBookSeq(10L)
                .userSeq(1L)
                .categorySeq(22L)
                .amount(BigDecimal.valueOf(23000))
                .transactionDate("20260415120000")
                .type(TransactionType.INCOME)
                .build();
        ReflectionTestUtils.setField(updated, "seq", 99L);

        when(transactionApplicationService.updateTransaction(eq(99L), any(TransactionRequest.class)))
                .thenReturn(updated);

        mockMvc.perform(put("/api/transactions/99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("S-00000"))
                .andExpect(jsonPath("$.data.seq").value(99L))
                .andExpect(jsonPath("$.data.type").value("INCOME"));
    }

    @Test
    @DisplayName("move category endpoint returns success response")
    void moveCategory_returnsSuccessResponse() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        when(transactionApplicationService.moveCategory(1L, 2L)).thenReturn(3);

        mockMvc.perform(put("/api/transactions/category/move")
                        .param("oldCategoryId", "1")
                        .param("newCategoryId", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("S-00000"))
                .andExpect(jsonPath("$.data").value(3));
    }

    private MockMvc buildMockMvc() {
        return MockMvcBuilders.standaloneSetup(transactionController)
                .setCustomArgumentResolvers(
                        new PageableHandlerMethodArgumentResolver(),
                        new CurrentUserArgumentResolver()
                )
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
