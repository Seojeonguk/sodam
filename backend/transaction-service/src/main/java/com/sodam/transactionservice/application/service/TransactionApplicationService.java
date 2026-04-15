package com.sodam.transactionservice.application.service;

import com.sodam.common.integration.ExternalResponseValidator;
import com.sodam.transactionservice.application.api.dto.TransactionListItemResponse;
import com.sodam.transactionservice.application.api.dto.TransactionListResponse;
import com.sodam.transactionservice.application.api.dto.TransactionRequest;
import com.sodam.transactionservice.application.api.dto.TransactionSearchRequest;
import com.sodam.transactionservice.domain.model.Transaction;
import com.sodam.transactionservice.domain.service.TransactionDomainService;
import com.sodam.transactionservice.infrastructure.CategoryListItemResponse;
import com.sodam.transactionservice.infrastructure.CategoryServiceClient;
import com.sodam.transactionservice.infrastructure.UserDto;
import com.sodam.transactionservice.infrastructure.UserServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionApplicationService {

    private final TransactionDomainService transactionDomainService;
    private final UserServiceClient userServiceClient;
    private final CategoryServiceClient categoryServiceClient;

    @Transactional
    public Transaction createTransaction(TransactionRequest request, String email) {
        request.setUserSeq(resolveUserId(email));
        return transactionDomainService.createTransaction(request);
    }

    @Transactional(readOnly = true)
    public Transaction getTransactionById(Long transactionSeq) {
        return transactionDomainService.getTransactionById(transactionSeq);
    }

    @Transactional
    public Transaction updateTransaction(Long transactionSeq, TransactionRequest request) {
        return transactionDomainService.updateTransaction(transactionSeq, request);
    }

    @Transactional
    public void deleteTransaction(Long transactionSeq) {
        transactionDomainService.deleteTransaction(transactionSeq);
    }

    @Transactional(readOnly = true)
    public TransactionListResponse getTransactions(TransactionSearchRequest searchRequest, Pageable pageable, String email) {
        searchRequest.setUserId(resolveUserId(email));

        Page<Transaction> transactions = transactionDomainService.getTransactionsByConditions(searchRequest, pageable);

        List<Long> categoryIds = transactions.getContent().stream()
                .map(Transaction::getCategorySeq)
                .distinct()
                .toList();

        List<CategoryListItemResponse> categories = categoryIds.isEmpty()
                ? List.of()
                : categoryServiceClient.getCategoriesByIds(categoryIds);

        if (categories == null) {
            log.warn("Category service returned null category list. categoryCount={}", categoryIds.size());
            categories = List.of();
        }

        Map<Long, String> categoryNames = categories.stream()
                .filter(Objects::nonNull)
                .filter(category -> category.getId() != null)
                .collect(Collectors.toMap(CategoryListItemResponse::getId, CategoryListItemResponse::getName));

        return TransactionListResponse.builder()
                .transactions(transactions.getContent().stream()
                        .map(transaction -> TransactionListItemResponse.from(
                                transaction,
                                categoryNames.getOrDefault(transaction.getCategorySeq(), "Unknown category")
                        ))
                        .toList())
                .pageNumber(transactions.getNumber())
                .pageSize(transactions.getSize())
                .totalElements(transactions.getTotalElements())
                .totalPages(transactions.getTotalPages())
                .build();
    }

    @Transactional
    public Integer moveCategory(Long oldCategoryId, Long newCategoryId) {
        Integer updatedCnt = transactionDomainService.moveCategory(oldCategoryId, newCategoryId);

        log.info("Moved transaction category. updatedCount={}, oldCategoryId={}, newCategoryId={}",
                updatedCnt, oldCategoryId, newCategoryId);

        return updatedCnt;
    }

    private Long resolveUserId(String email) {
        UserDto user = ExternalResponseValidator.requireData(userServiceClient.getUser(email), "user-service");
        return ExternalResponseValidator.requireField(user, UserDto::getId, "user-service", "user id");
    }
}
