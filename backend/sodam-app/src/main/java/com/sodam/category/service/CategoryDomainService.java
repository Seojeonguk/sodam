package com.sodam.category.service;

import com.sodam.category.domain.Category;
import com.sodam.category.dto.CategoryCreateRequest;
import com.sodam.category.dto.CategoryListRequest;
import com.sodam.category.dto.CategoryUpdateRequest;
import com.sodam.category.repository.CategoryRepository;
import com.sodam.category.repository.CategorySpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CategoryDomainService {

    private final CategoryRepository categoryRepository;

    @Transactional
    public Category createCategory(CategoryCreateRequest request) {
        Category category = Category.builder()
                .name(request.getName()).description(request.getDescription())
                .color(request.getColor()).userSeq(request.getUserSeq())
                .type(request.getType() != null ? request.getType() : "EXPENSE")
                .build();
        return categoryRepository.save(category);
    }

    @Transactional(readOnly = true)
    public Page<Category> getCategoriesByConditions(CategoryListRequest req, Pageable pageable) {
        return categoryRepository.findAll(CategorySpecification.searchByConditions(req), pageable);
    }

    @Transactional(readOnly = true)
    public Category getCategoryById(Long id, Long userId) {
        Category c = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 카테고리입니다: " + id));
        if (!c.getUserSeq().equals(userId))
            throw new IllegalArgumentException("카테고리 접근 권한이 없습니다.");
        return c;
    }

    @Transactional
    public Category updateCategory(Long id, CategoryUpdateRequest request, Long userId) {
        Category c = getCategoryById(id, userId);
        c.updateCategory(request.getName(), request.getDescription(), request.getColor(), request.getType());
        return categoryRepository.save(c);
    }

    @Transactional
    public void deleteCategory(Long id, Long userId) {
        Category c = getCategoryById(id, userId);
        categoryRepository.delete(c);
    }
}
