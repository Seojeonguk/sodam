package com.sodam.accountbookservice.application.api.contoller;

import com.sodam.accountbookservice.application.api.dto.AccountBookCreateRequest;
import com.sodam.accountbookservice.application.api.dto.AccountBookListResponse;
import com.sodam.accountbookservice.application.api.dto.AccountBookResponse;
import com.sodam.accountbookservice.application.api.dto.AccountBookUpdateRequest;
import com.sodam.accountbookservice.application.service.AccountBookApplicationService;
import com.sodam.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/account-books")
public class AccountBookController {
    private final AccountBookApplicationService service;

    @GetMapping()
    public ApiResponse<List<AccountBookListResponse>> getAccountBooks(@RequestHeader("X-User-Email") String email) {
        return ApiResponse.success(service.getAccountBooks(email));
    }

    @PostMapping
    public ApiResponse<AccountBookResponse> createAccountBook(@Valid @RequestBody AccountBookCreateRequest request, @RequestHeader(value = "X-User-Email", required = false) String email) {
        return ApiResponse.success(service.createAccountBook(request, email));
    }

    @PutMapping("/{id}")
    public ApiResponse<AccountBookResponse> updateAccountBook(@PathVariable Long id, @Valid @RequestBody AccountBookUpdateRequest request, @RequestHeader("X-User-Email") String email) {
        return ApiResponse.success(service.updateAccountBook(id, request, email));
    }

    @GetMapping("/{id}")
    public ApiResponse<AccountBookResponse> getAccountBook(@PathVariable Long id, @RequestHeader("X-User-Email") String email) {
        return ApiResponse.success(service.getAccountBook(id, email));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteAccountBook(@PathVariable Long id, @RequestHeader("X-User-Email") String email) {
        service.deleteAccountBook(id, email);
        return ApiResponse.success(null);
    }
}
