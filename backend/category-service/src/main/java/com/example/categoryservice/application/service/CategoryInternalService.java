package com.example.categoryservice.application.service;

import com.example.categoryservice.application.api.dto.CategoryListItemResponse;
import com.example.categoryservice.domain.model.Category;
import com.example.categoryservice.domain.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryInternalService {

    private final CategoryService categoryService;

    public List<CategoryListItemResponse> getCategoriesByIds(List<Long> ids) {

        List<Category> categories = categoryService.getCategoriesByIds(ids);

        return categories.stream().map(CategoryListItemResponse::from).toList();
    }
}
