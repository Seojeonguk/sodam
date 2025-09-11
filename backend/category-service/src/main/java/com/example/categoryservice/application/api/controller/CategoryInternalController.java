package com.example.categoryservice.application.api.controller;

import com.example.categoryservice.application.api.dto.CategoryListItemResponse;
import com.example.categoryservice.application.service.CategoryInternalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/internal/categories")
public class CategoryInternalController {

    private final CategoryInternalService categoryInternalService;

    @GetMapping
    public ResponseEntity<List<CategoryListItemResponse>> getCategoriesByIds(@RequestParam(value = "ids", required = false) final List<Long> ids) {
        List<CategoryListItemResponse> response = categoryInternalService.getCategoriesByIds(ids);

        return ResponseEntity.ok(response);
    }
}
