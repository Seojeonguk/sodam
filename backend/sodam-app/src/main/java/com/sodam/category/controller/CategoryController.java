package com.sodam.category.controller;

import com.sodam.category.dto.*;
import com.sodam.category.service.CategoryApplicationService;
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
    public ResponseEntity<ApiResponse<CategoryResponse>> create(
            @RequestBody CategoryCreateRequest request,
            @CurrentUser UserContext userContext
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(service.createCategory(request, userContext.email())));
    }

    @GetMapping
    public ApiResponse<CategoryListResponse> list(
            @ModelAttribute CategoryListRequest request,
            Pageable pageable,
            @CurrentUser UserContext userContext
    ) {
        return ApiResponse.success(service.getCategories(request, pageable, userContext.email()));
    }

    @GetMapping("/{id}")
    public ApiResponse<CategoryResponse> get(@PathVariable Long id, @CurrentUser UserContext userContext) {
        return ApiResponse.success(service.getCategory(id, userContext.email()));
    }

    @PutMapping("/{id}")
    public ApiResponse<CategoryResponse> update(
            @PathVariable Long id,
            @RequestBody CategoryUpdateRequest request,
            @CurrentUser UserContext userContext
    ) {
        return ApiResponse.success(service.updateCategory(id, request, userContext.email()));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @PathVariable Long id,
            @CurrentUser UserContext userContext,
            @RequestBody CategoryDeleteRequest request
    ) {
        service.deleteCategory(id, userContext.email(), request);
        return ApiResponse.success(null);
    }
}
