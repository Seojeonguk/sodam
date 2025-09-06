package com.example.categoryservice.domain.service;

import com.example.categoryservice.application.api.dto.CategoryCreateRequest;
import com.example.categoryservice.domain.model.Category;
import com.example.categoryservice.domain.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
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
}
