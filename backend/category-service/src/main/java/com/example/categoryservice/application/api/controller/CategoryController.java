package com.example.categoryservice.application.api.controller;

import com.example.categoryservice.application.api.dto.*;
import com.example.categoryservice.application.service.CategoryApplicationService;
import com.sodam.common.response.ApiResponse;
import com.sodam.common.security.CurrentUser;
import com.sodam.common.security.UserContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryApplicationService service;

    @PostMapping
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
            @RequestBody CategoryCreateRequest category,
            @CurrentUser UserContext userContext
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(service.createCategory(category, userContext.email())));
    }

    @GetMapping
    public ApiResponse<CategoryListResponse> getCategories(
            @ModelAttribute CategoryListRequest request,
            Pageable pageable,
            @CurrentUser UserContext userContext
    ) {
        return ApiResponse.success(service.getCategories(request, pageable, userContext.email()));
    }

    @PutMapping("/{id}")
    public ApiResponse<CategoryResponse> updateCategory(
            @PathVariable Long id,
            @RequestBody CategoryUpdateRequest request,
            @CurrentUser UserContext userContext
    ) {
        return ApiResponse.success(service.updateCategory(id, request, userContext.email()));
    }

    @GetMapping("/{id}")
    public ApiResponse<CategoryResponse> getCategory(@PathVariable Long id, @CurrentUser UserContext userContext) {
        return ApiResponse.success(service.getCategory(id, userContext.email()));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteCategory(
            @PathVariable Long id,
            @CurrentUser UserContext userContext,
            @RequestBody CategoryDeleteRequest request
    ) {
        service.deleteCategory(id, userContext.email(), request);
        return ApiResponse.success(null);
    }
}
