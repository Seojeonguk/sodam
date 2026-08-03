package com.sodam.category.service;

import com.sodam.category.dto.*;
import com.sodam.transaction.service.TransactionApplicationService;
import com.sodam.user.service.UserDomainService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CategoryApplicationService {

    private final CategoryDomainService categoryDomainService;
    private final UserDomainService userDomainService;
    private final TransactionApplicationService transactionApplicationService;

    @Transactional
    public CategoryResponse createCategory(CategoryCreateRequest request, String email) {
        request.setUserSeq(userDomainService.findUserByEmail(email).getId());
        var c = categoryDomainService.createCategory(request);
        return CategoryResponse.builder().name(c.getName()).description(c.getDescription())
                .color(c.getColor()).type(c.getType()).build();
    }

    @Transactional(readOnly = true)
    public CategoryListResponse getCategories(CategoryListRequest request, Pageable pageable, String email) {
        request.setUserSeq(userDomainService.findUserByEmail(email).getId());
        Page<com.sodam.category.domain.Category> page = categoryDomainService.getCategoriesByConditions(request, pageable);
        return CategoryListResponse.builder()
                .categories(page.getContent().stream().map(CategoryListItemResponse::from).toList())
                .pageNumber(page.getNumber()).pageSize(page.getSize())
                .totalElements(page.getTotalElements()).totalPages(page.getTotalPages()).build();
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryUpdateRequest request, String email) {
        Long userId = userDomainService.findUserByEmail(email).getId();
        var c = categoryDomainService.updateCategory(id, request, userId);
        return CategoryResponse.builder().name(c.getName()).description(c.getDescription())
                .color(c.getColor()).type(c.getType()).build();
    }

    @Transactional(readOnly = true)
    public CategoryResponse getCategory(Long id, String email) {
        Long userId = userDomainService.findUserByEmail(email).getId();
        var c = categoryDomainService.getCategoryById(id, userId);
        return CategoryResponse.builder().name(c.getName()).description(c.getDescription())
                .color(c.getColor()).type(c.getType()).build();
    }

    @Transactional
    public void deleteCategory(Long id, String email, CategoryDeleteRequest request) {
        Long userId = userDomainService.findUserByEmail(email).getId();
        if (request.getReplaceCategoryId() != null) {
            transactionApplicationService.moveCategory(id, request.getReplaceCategoryId());
        }
        categoryDomainService.deleteCategory(id, userId);
    }
}
