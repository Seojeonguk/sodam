package com.sodam.accountbook.controller;

import com.sodam.accountbook.dto.*;
import com.sodam.accountbook.service.AccountBookApplicationService;
import com.sodam.common.response.ApiResponse;
import com.sodam.common.security.CurrentUser;
import com.sodam.common.security.UserContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/account-books")
@RequiredArgsConstructor
public class AccountBookController {

    private final AccountBookApplicationService service;

    @PostMapping
    public ResponseEntity<ApiResponse<AccountBookResponse>> create(
            @RequestBody AccountBookCreateRequest request,
            @CurrentUser UserContext userContext
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(service.createAccountBook(request, userContext.email())));
    }

    @GetMapping
    public ApiResponse<List<AccountBookListResponse>> list(@CurrentUser UserContext userContext) {
        return ApiResponse.success(service.getAccountBooks(userContext.email()));
    }

    @GetMapping("/{id}")
    public ApiResponse<AccountBookResponse> get(@PathVariable Long id, @CurrentUser UserContext userContext) {
        return ApiResponse.success(service.getAccountBook(id, userContext.email()));
    }

    @PutMapping("/{id}")
    public ApiResponse<AccountBookResponse> update(
            @PathVariable Long id,
            @RequestBody AccountBookUpdateRequest request,
            @CurrentUser UserContext userContext
    ) {
        return ApiResponse.success(service.updateAccountBook(id, request, userContext.email()));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id, @CurrentUser UserContext userContext) {
        service.deleteAccountBook(id, userContext.email());
        return ApiResponse.success(null);
    }
}
