package com.sodam.transactionservice.application.api.controller;

import com.sodam.common.response.ApiResponse;
import com.sodam.common.security.CurrentUser;
import com.sodam.common.security.UserContext;
import com.sodam.transactionservice.application.api.dto.*;
import com.sodam.transactionservice.application.service.TransactionApplicationService;
import com.sodam.transactionservice.domain.model.Transaction;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@Slf4j
public class TransactionController {

    private final TransactionApplicationService transactionApplicationService;

    @PostMapping
    public ResponseEntity<ApiResponse<TransactionResponse>> createTransaction(
            @Valid @RequestBody TransactionRequest request,
            @CurrentUser UserContext userContext
    ) {
        log.info("거래 생성 요청: {}", request);
        Transaction transaction = transactionApplicationService.createTransaction(request, userContext.email());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(TransactionResponse.from(transaction)));
    }

    @GetMapping("/{id}")
    public ApiResponse<TransactionResponse> getTransactionById(@PathVariable Long id) {
        log.info("거래 조회 요청 ID: {}", id);
        Transaction transaction = transactionApplicationService.getTransactionById(id);
        return ApiResponse.success(TransactionResponse.from(transaction));
    }

    @PutMapping("/{id}")
    public ApiResponse<TransactionResponse> updateTransaction(
            @PathVariable Long id,
            @Valid @RequestBody TransactionRequest request
    ) {
        log.info("거래 [{}] 업데이트 요청: {}", id, request);
        Transaction updatedTransaction = transactionApplicationService.updateTransaction(id, request);
        return ApiResponse.success(TransactionResponse.from(updatedTransaction));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteTransaction(@PathVariable Long id) {
        log.info("거래 [{}] 삭제 요청", id);
        transactionApplicationService.deleteTransaction(id);
        return ApiResponse.success(null);
    }

    @GetMapping
    public ApiResponse<TransactionListResponse> getTransactions(
            @ModelAttribute TransactionSearchRequest searchRequest,
            Pageable pageable,
            @CurrentUser UserContext userContext
    ) {
        log.info("거래 목록 조회 요청: 조건 = {}, 페이징 = {}", searchRequest, pageable);
        log.info("거래 목록 조회 요청 사용자 id : {}", userContext.email());
        return ApiResponse.success(transactionApplicationService.getTransactions(searchRequest, pageable, userContext.email()));
    }

    @PutMapping("category/move")
    public ApiResponse<Integer> moveCategory(
            @RequestParam Long oldCategoryId,
            @RequestParam Long newCategoryId
    ) {
        return ApiResponse.success(transactionApplicationService.moveCategory(oldCategoryId, newCategoryId));
    }
}
