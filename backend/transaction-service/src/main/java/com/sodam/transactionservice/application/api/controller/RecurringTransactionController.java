package com.sodam.transactionservice.application.api.controller;

import com.sodam.common.response.ApiResponse;
import com.sodam.common.security.CurrentUser;
import com.sodam.common.security.UserContext;
import com.sodam.transactionservice.application.api.dto.RecurringTransactionRequest;
import com.sodam.transactionservice.application.api.dto.RecurringTransactionResponse;
import com.sodam.transactionservice.application.service.RecurringTransactionApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recurring-transactions")
@RequiredArgsConstructor
@Slf4j
public class RecurringTransactionController {

    private final RecurringTransactionApplicationService service;

    @PostMapping
    public ResponseEntity<ApiResponse<RecurringTransactionResponse>> create(
            @Valid @RequestBody RecurringTransactionRequest request,
            @CurrentUser UserContext userContext
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(service.create(request, userContext.email())));
    }

    @PutMapping("/{id}")
    public ApiResponse<RecurringTransactionResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody RecurringTransactionRequest request
    ) {
        return ApiResponse.success(service.update(id, request));
    }

    @PatchMapping("/{id}/toggle")
    public ApiResponse<RecurringTransactionResponse> toggle(@PathVariable Long id) {
        return ApiResponse.success(service.toggle(id));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ApiResponse.success(null);
    }

    @GetMapping
    public ApiResponse<List<RecurringTransactionResponse>> getList(
            @RequestParam Long accountBookSeq
    ) {
        return ApiResponse.success(service.getList(accountBookSeq));
    }
}
