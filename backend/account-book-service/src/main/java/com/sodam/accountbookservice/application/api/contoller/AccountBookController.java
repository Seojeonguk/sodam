package com.sodam.accountbookservice.application.api.contoller;

import com.sodam.accountbookservice.application.api.dto.AccountBookCreateRequest;
import com.sodam.accountbookservice.application.api.dto.AccountBookListResponse;
import com.sodam.accountbookservice.application.api.dto.AccountBookResponse;
import com.sodam.accountbookservice.application.api.dto.AccountBookUpdateRequest;
import com.sodam.accountbookservice.application.service.AccountBookApplicationService;
import com.sodam.common.response.ApiResponse;
import com.sodam.common.security.CurrentUser;
import com.sodam.common.security.UserContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/account-books")
public class AccountBookController {
    private final AccountBookApplicationService service;

    @GetMapping
    public ApiResponse<List<AccountBookListResponse>> getAccountBooks(@CurrentUser UserContext userContext) {
        return ApiResponse.success(service.getAccountBooks(userContext.email()));
    }

    @PostMapping
    public ApiResponse<AccountBookResponse> createAccountBook(
            @Valid @RequestBody AccountBookCreateRequest request,
            @CurrentUser(required = false) UserContext userContext
    ) {
        return ApiResponse.success(service.createAccountBook(request, userContext.email()));
    }

    @PutMapping("/{id}")
    public ApiResponse<AccountBookResponse> updateAccountBook(
            @PathVariable Long id,
            @Valid @RequestBody AccountBookUpdateRequest request,
            @CurrentUser UserContext userContext
    ) {
        return ApiResponse.success(service.updateAccountBook(id, request, userContext.email()));
    }

    @GetMapping("/{id}")
    public ApiResponse<AccountBookResponse> getAccountBook(@PathVariable Long id, @CurrentUser UserContext userContext) {
        return ApiResponse.success(service.getAccountBook(id, userContext.email()));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteAccountBook(@PathVariable Long id, @CurrentUser UserContext userContext) {
        service.deleteAccountBook(id, userContext.email());
        return ApiResponse.success(null);
    }
}
