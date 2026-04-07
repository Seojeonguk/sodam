package com.example.categoryservice.application.api.controller;

import com.example.categoryservice.application.api.dto.*;
import com.example.categoryservice.application.service.CategoryApplicationService;
import com.sodam.common.response.ApiResponse;
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

    @PostMapping()
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(@RequestBody CategoryCreateRequest category, @RequestHeader("X-User-Email") String email) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(service.createCategory(category, email)));
    }

    @GetMapping
    public ApiResponse<CategoryListResponse> getCategories(
            @ModelAttribute CategoryListRequest request,
            Pageable pageable,
            @RequestHeader("X-User-Email") String email
    ) {
        return ApiResponse.success(service.getCategories(request, pageable, email));
    }

    @PutMapping("/{id}")
    public ApiResponse<CategoryResponse> updateCategory(
            @PathVariable Long id,
            @RequestBody CategoryUpdateRequest request,
            @RequestHeader("X-User-Email") String email) {
        return ApiResponse.success(service.updateCategory(id, request, email));
    }

    @GetMapping("/{id}")
    public ApiResponse<CategoryResponse> getCategory(@PathVariable Long id, @RequestHeader("X-User-Email") String email) {
        return ApiResponse.success(service.getCategory(id, email));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteCategory(@PathVariable Long id, @RequestHeader("X-User-Email") String email, @RequestBody CategoryDeleteRequest request) {
        service.deleteCategory(id, email, request);
        return ApiResponse.success(null);
    }
}
