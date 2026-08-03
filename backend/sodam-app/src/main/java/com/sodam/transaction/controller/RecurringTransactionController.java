package com.sodam.transaction.controller;

import com.sodam.common.response.ApiResponse;
import com.sodam.common.security.CurrentUser;
import com.sodam.common.security.UserContext;
import com.sodam.transaction.dto.*;
import com.sodam.transaction.service.RecurringTransactionApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recurring-transactions")
@RequiredArgsConstructor
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
            @PathVariable Long id, @Valid @RequestBody RecurringTransactionRequest request
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
    public ApiResponse<List<RecurringTransactionResponse>> list(@RequestParam Long accountBookSeq) {
        return ApiResponse.success(service.getList(accountBookSeq));
    }
}
