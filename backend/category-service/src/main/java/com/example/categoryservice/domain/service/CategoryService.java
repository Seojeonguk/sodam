package com.example.categoryservice.domain.service;

import com.example.categoryservice.application.api.dto.CategoryCreateRequest;
import com.example.categoryservice.application.api.dto.CategoryListRequest;
import com.example.categoryservice.domain.model.Category;
import com.example.categoryservice.domain.repository.CategoryRepository;
import com.example.categoryservice.domain.repository.CategorySpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional
    public Category createCategory(CategoryCreateRequest request) {
        Category category = Category.builder()
                .name(request.getName())
                .description(request.getDescription())
                .userSeq(request.getUserSeq())
                .build();

        return categoryRepository.save(category);
    }

    @Transactional(readOnly = true)
    public Page<Category> getCategoriesByConditions(CategoryListRequest request, Pageable pageable) {
        return categoryRepository.findAll(
                CategorySpecification.searchByConditions(request),
                pageable
        );
    }
}
