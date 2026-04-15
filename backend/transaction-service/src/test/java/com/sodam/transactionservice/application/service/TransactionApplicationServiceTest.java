package com.sodam.transactionservice.application.service;

import com.sodam.common.exception.CustomException;
import com.sodam.common.response.ApiResponse;
import com.sodam.transactionservice.application.api.dto.TransactionListResponse;
import com.sodam.transactionservice.application.api.dto.TransactionRequest;
import com.sodam.transactionservice.application.api.dto.TransactionSearchRequest;
import com.sodam.transactionservice.domain.model.Transaction;
import com.sodam.transactionservice.domain.model.TransactionType;
import com.sodam.transactionservice.domain.service.TransactionDomainService;
import com.sodam.transactionservice.infrastructure.CategoryListItemResponse;
import com.sodam.transactionservice.infrastructure.CategoryServiceClient;
import com.sodam.transactionservice.infrastructure.UserDto;
import com.sodam.transactionservice.infrastructure.UserServiceClient;
import java.math.BigDecimal;
import java.util.List;
import feign.FeignException;
import feign.Request;
import feign.RequestTemplate;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransactionApplicationServiceTest {

    @Mock
    private TransactionDomainService transactionDomainService;

    @Mock
    private UserServiceClient userServiceClient;

    @Mock
    private CategoryServiceClient categoryServiceClient;

    @InjectMocks
    private TransactionApplicationService transactionApplicationService;

    @Test
    @DisplayName("create transaction resolves user id from email")
    void createTransaction_setsUserSeqFromUserService() {
        TransactionRequest request = TransactionRequest.builder()
                .accountBookSeq(10L)
                .categorySeq(20L)
                .amount(BigDecimal.valueOf(10000))
                .transactionDate("20260414120000")
                .type(TransactionType.EXPENSE)
                .build();

        UserDto userDto = new UserDto();
        userDto.setId(7L);
        userDto.setEmail("user@example.com");

        Transaction savedTransaction = Transaction.builder()
                .accountBookSeq(10L)
                .userSeq(7L)
                .categorySeq(20L)
                .amount(BigDecimal.valueOf(10000))
                .transactionDate("20260414120000")
                .type(TransactionType.EXPENSE)
                .build();

        when(userServiceClient.getUser("user@example.com"))
                .thenReturn(ApiResponse.success(userDto));
        when(transactionDomainService.createTransaction(any(TransactionRequest.class)))
                .thenReturn(savedTransaction);

        Transaction result = transactionApplicationService.createTransaction(request, "user@example.com");

        ArgumentCaptor<TransactionRequest> requestCaptor = ArgumentCaptor.forClass(TransactionRequest.class);
        verify(transactionDomainService).createTransaction(requestCaptor.capture());
        assertThat(requestCaptor.getValue().getUserSeq()).isEqualTo(7L);
        assertThat(result.getUserSeq()).isEqualTo(7L);
    }

    @Test
    @DisplayName("get transactions maps category names for response items")
    void getTransactions_mapsCategoryNamesAndUserId() {
        TransactionSearchRequest searchRequest = new TransactionSearchRequest();
        searchRequest.setAccountBookSeq(10L);
        Pageable pageable = PageRequest.of(0, 20);

        UserDto userDto = new UserDto();
        userDto.setId(5L);
        userDto.setEmail("user@example.com");

        Transaction transaction = Transaction.builder()
                .accountBookSeq(10L)
                .userSeq(5L)
                .categorySeq(30L)
                .amount(BigDecimal.valueOf(15000))
                .description("lunch")
                .transactionDate("20260414120000")
                .type(TransactionType.EXPENSE)
                .build();
        ReflectionTestUtils.setField(transaction, "seq", 100L);

        Page<Transaction> transactionPage = new PageImpl<>(List.of(transaction), pageable, 1);

        when(userServiceClient.getUser("user@example.com"))
                .thenReturn(ApiResponse.success(userDto));
        when(transactionDomainService.getTransactionsByConditions(any(TransactionSearchRequest.class), eq(pageable)))
                .thenReturn(transactionPage);
        when(categoryServiceClient.getCategoriesByIds(List.of(30L)))
                .thenReturn(List.of(CategoryListItemResponse.builder().id(30L).name("food").build()));

        TransactionListResponse response =
                transactionApplicationService.getTransactions(searchRequest, pageable, "user@example.com");

        assertThat(searchRequest.getUserId()).isEqualTo(5L);
        assertThat(response.getTransactions()).hasSize(1);
        assertThat(response.getTransactions().get(0).getCategoryName()).isEqualTo("food");
    }

    @Test
    @DisplayName("get transactions falls back to a non-empty category name")
    void getTransactions_fallsBackToDefaultCategoryName() {
        TransactionSearchRequest searchRequest = new TransactionSearchRequest();
        Pageable pageable = PageRequest.of(0, 20);

        UserDto userDto = new UserDto();
        userDto.setId(5L);

        Transaction transaction = Transaction.builder()
                .accountBookSeq(10L)
                .userSeq(5L)
                .categorySeq(30L)
                .amount(BigDecimal.valueOf(15000))
                .transactionDate("20260414120000")
                .type(TransactionType.EXPENSE)
                .build();
        ReflectionTestUtils.setField(transaction, "seq", 101L);

        when(userServiceClient.getUser("user@example.com"))
                .thenReturn(ApiResponse.success(userDto));
        when(transactionDomainService.getTransactionsByConditions(any(TransactionSearchRequest.class), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(transaction), pageable, 1));
        when(categoryServiceClient.getCategoriesByIds(List.of(30L)))
                .thenReturn(List.of());

        TransactionListResponse response =
                transactionApplicationService.getTransactions(searchRequest, pageable, "user@example.com");

        assertThat(response.getTransactions().get(0).getCategoryName()).isNotBlank();
    }

    @Test
    @DisplayName("create transaction throws when user response has no data")
    void createTransaction_throwsWhenUserResponseHasNoData() {
        TransactionRequest request = TransactionRequest.builder()
                .accountBookSeq(10L)
                .categorySeq(20L)
                .amount(BigDecimal.valueOf(10000))
                .transactionDate("20260414120000")
                .type(TransactionType.EXPENSE)
                .build();

        when(userServiceClient.getUser("user@example.com"))
                .thenReturn(ApiResponse.success(null));

        assertThatThrownBy(() -> transactionApplicationService.createTransaction(request, "user@example.com"))
                .isInstanceOf(CustomException.class)
                .hasMessageContaining("user-service");
    }

    @Test
    @DisplayName("get transactions skips category lookup when page content is empty")
    void getTransactions_skipsCategoryLookupWhenEmpty() {
        TransactionSearchRequest searchRequest = new TransactionSearchRequest();
        Pageable pageable = PageRequest.of(0, 20);

        UserDto userDto = new UserDto();
        userDto.setId(5L);

        when(userServiceClient.getUser("user@example.com"))
                .thenReturn(ApiResponse.success(userDto));
        when(transactionDomainService.getTransactionsByConditions(any(TransactionSearchRequest.class), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(), pageable, 0));

        TransactionListResponse response =
                transactionApplicationService.getTransactions(searchRequest, pageable, "user@example.com");

        assertThat(response.getTransactions()).isEmpty();
        assertThat(response.getTotalElements()).isZero();
    }

    @Test
    @DisplayName("get transactions tolerates null category response")
    void getTransactions_toleratesNullCategoryResponse() {
        TransactionSearchRequest searchRequest = new TransactionSearchRequest();
        Pageable pageable = PageRequest.of(0, 20);

        UserDto userDto = new UserDto();
        userDto.setId(5L);

        Transaction transaction = Transaction.builder()
                .accountBookSeq(10L)
                .userSeq(5L)
                .categorySeq(30L)
                .amount(BigDecimal.valueOf(15000))
                .transactionDate("20260414120000")
                .type(TransactionType.EXPENSE)
                .build();
        ReflectionTestUtils.setField(transaction, "seq", 103L);

        when(userServiceClient.getUser("user@example.com"))
                .thenReturn(ApiResponse.success(userDto));
        when(transactionDomainService.getTransactionsByConditions(any(TransactionSearchRequest.class), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(transaction), pageable, 1));
        when(categoryServiceClient.getCategoriesByIds(List.of(30L)))
                .thenReturn(null);

        TransactionListResponse response =
                transactionApplicationService.getTransactions(searchRequest, pageable, "user@example.com");

        assertThat(response.getTransactions()).hasSize(1);
        assertThat(response.getTransactions().get(0).getCategoryName()).isEqualTo("Unknown category");
    }

    @Test
    @DisplayName("moveCategory returns updated count in response body")
    void moveCategory_returnsUpdatedCount() {
        when(transactionDomainService.moveCategory(1L, 2L)).thenReturn(4);

        Integer response = transactionApplicationService.moveCategory(1L, 2L);

        assertThat(response).isEqualTo(4);
    }

    @Test
    @DisplayName("get transactions propagates category service feign exception")
    void getTransactions_propagatesCategoryServiceFeignException() {
        TransactionSearchRequest searchRequest = new TransactionSearchRequest();
        Pageable pageable = PageRequest.of(0, 20);

        UserDto userDto = new UserDto();
        userDto.setId(5L);

        Transaction transaction = Transaction.builder()
                .accountBookSeq(10L)
                .userSeq(5L)
                .categorySeq(30L)
                .amount(BigDecimal.valueOf(15000))
                .transactionDate("20260414120000")
                .type(TransactionType.EXPENSE)
                .build();
        ReflectionTestUtils.setField(transaction, "seq", 102L);

        when(userServiceClient.getUser("user@example.com"))
                .thenReturn(ApiResponse.success(userDto));
        when(transactionDomainService.getTransactionsByConditions(any(TransactionSearchRequest.class), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(transaction), pageable, 1));
        when(categoryServiceClient.getCategoriesByIds(List.of(30L)))
                .thenThrow(feignException(503, Request.HttpMethod.GET, "CategoryClient#getCategoriesByIds"));

        assertThatThrownBy(() ->
                transactionApplicationService.getTransactions(searchRequest, pageable, "user@example.com"))
                .isInstanceOf(FeignException.class);
    }

    private FeignException feignException(int status, Request.HttpMethod method, String methodKey) {
        return FeignException.errorStatus(
                methodKey,
                feign.Response.builder()
                        .status(status)
                        .reason("upstream error")
                        .request(Request.create(
                                method,
                                "http://localhost/test",
                                java.util.Map.of(),
                                null,
                                StandardCharsets.UTF_8,
                                new RequestTemplate()
                        ))
                        .build()
        );
    }
}
