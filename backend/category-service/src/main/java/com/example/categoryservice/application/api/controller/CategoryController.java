package com.example.categoryservice.application.api.controller;

import com.example.categoryservice.application.api.dto.CategoryCreateRequest;
import com.example.categoryservice.application.api.dto.CategoryResponse;
import com.example.categoryservice.application.service.CategoryApplicationService;
import lombok.RequiredArgsConstructor;
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
}
