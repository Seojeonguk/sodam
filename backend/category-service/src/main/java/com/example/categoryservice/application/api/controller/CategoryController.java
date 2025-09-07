package com.example.categoryservice.application.api.controller;

import com.example.categoryservice.application.api.dto.*;
import com.example.categoryservice.application.service.CategoryApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryApplicationService service;

    @PostMapping()
    public ResponseEntity<CategoryResponse> createCategory(@RequestBody CategoryCreateRequest category, @RequestHeader("X-User-Email") String email) {
        return ResponseEntity.ok(service.createCategory(category, email));
    }

    @GetMapping
    public ResponseEntity<CategoryListResponse> getCategories(
            @ModelAttribute CategoryListRequest request,
            Pageable pageable,
            @RequestHeader("X-User-Email") String email
    ) {
        return ResponseEntity.ok(service.getCategories(request, pageable, email));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable Long id,
            @RequestBody CategoryUpdateRequest request,
            @RequestHeader("X-User-Email") String email) {
        return ResponseEntity.ok(service.updateCategory(id, request, email));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponse> getCategory(@PathVariable Long id, @RequestHeader("X-User-Email") String email) {
        return ResponseEntity.ok(service.getCategory(id, email));
    }
}
