package com.sodam.transaction.controller;

import com.sodam.common.response.ApiResponse;
import com.sodam.common.security.CurrentUser;
import com.sodam.common.security.UserContext;
import com.sodam.transaction.dto.*;
import com.sodam.transaction.service.TransactionApplicationService;
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

    private final TransactionApplicationService service;

    @PostMapping
    public ResponseEntity<ApiResponse<TransactionResponse>> create(
            @Valid @RequestBody TransactionRequest request,
            @CurrentUser UserContext userContext
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(TransactionResponse.from(service.createTransaction(request, userContext.email()))));
    }

    @GetMapping("/{id}")
    public ApiResponse<TransactionResponse> get(@PathVariable Long id) {
        return ApiResponse.success(TransactionResponse.from(service.getTransactionById(id)));
    }

    @PutMapping("/{id}")
    public ApiResponse<TransactionResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody TransactionRequest request
    ) {
        return ApiResponse.success(TransactionResponse.from(service.updateTransaction(id, request)));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        service.deleteTransaction(id);
        return ApiResponse.success(null);
    }

    @GetMapping
    public ApiResponse<TransactionListResponse> list(
            @ModelAttribute TransactionSearchRequest req,
            Pageable pageable,
            @CurrentUser UserContext userContext
    ) {
        return ApiResponse.success(service.getTransactions(req, pageable, userContext.email()));
    }

    @PutMapping("category/move")
    public ApiResponse<Integer> moveCategory(
            @RequestParam Long oldCategoryId,
            @RequestParam Long newCategoryId
    ) {
        return ApiResponse.success(service.moveCategory(oldCategoryId, newCategoryId));
    }

    @GetMapping("/stat")
    public ApiResponse<?> getStat(
            @ModelAttribute StatRequest request,
            @CurrentUser UserContext userContext
    ) {
        return ApiResponse.success(service.getStat(request, userContext.email()));
    }

    @GetMapping("/stat/period")
    public ApiResponse<?> getPeriodStat(
            @ModelAttribute StatPeriodRequest request,
            @CurrentUser UserContext userContext
    ) {
        return ApiResponse.success(service.getPeriodStat(request, userContext.email()));
    }
}
