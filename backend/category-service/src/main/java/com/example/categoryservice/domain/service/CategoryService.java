package com.example.categoryservice.domain.service;

import com.example.categoryservice.application.api.dto.CategoryCreateRequest;
import com.example.categoryservice.application.api.dto.CategoryListRequest;
import com.example.categoryservice.application.api.dto.CategoryUpdateRequest;
import com.example.categoryservice.domain.model.Category;
import com.example.categoryservice.domain.repository.CategoryRepository;
import com.example.categoryservice.domain.repository.CategorySpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional
    public Category createCategory(CategoryCreateRequest request) {
        Category category = Category.builder()
                .name(request.getName())
                .description(request.getDescription())
                .color(request.getColor())
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

    @Transactional
    public Category updateCategory(Long id, CategoryUpdateRequest request, Long userId) {
        Category category = getCategoryById(id);
        if (!category.getUserSeq().equals(userId)) {
            throw new IllegalArgumentException("카테고리 작성자가 아닙니다: " + userId);
        }
        category.updateCategory(request);
        return categoryRepository.save(category);
    }

    @Transactional(readOnly = true)
    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id).orElse(null);
    }

    @Transactional(readOnly = true)
    public Category getCategoryById(Long id, Long userId) {
        Category category = getCategoryById(id);
        if (!category.getUserSeq().equals(userId)) {
            throw new IllegalArgumentException("카테고리 작성자가 아닙니다: " + userId);
        }
        return category;
    }

    @Transactional
    public void deleteCategory(Long id, Long userId) {
        Category category = getCategoryById(id);
        if (!category.getUserSeq().equals(userId)) {
            throw new IllegalArgumentException("카테고리 작성자가 아닙니다: " + userId);
        }
        categoryRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<Category> getCategoriesByIds(List<Long> ids) {
        return categoryRepository.findAllById(ids);
    }
}
