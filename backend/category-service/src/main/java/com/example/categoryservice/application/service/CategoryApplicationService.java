package com.example.categoryservice.application.service;

import com.example.categoryservice.application.api.dto.CategoryCreateRequest;
import com.example.categoryservice.application.api.dto.CategoryDeleteRequest;
import com.example.categoryservice.application.api.dto.CategoryListItemResponse;
import com.example.categoryservice.application.api.dto.CategoryListRequest;
import com.example.categoryservice.application.api.dto.CategoryListResponse;
import com.example.categoryservice.application.api.dto.CategoryResponse;
import com.example.categoryservice.application.api.dto.CategoryUpdateRequest;
import com.example.categoryservice.domain.model.Category;
import com.example.categoryservice.domain.service.CategoryService;
import com.example.categoryservice.infrastructure.TransactionServiceClient;
import com.example.categoryservice.infrastructure.UserDto;
import com.example.categoryservice.infrastructure.UserServiceClient;
import com.sodam.common.integration.ExternalResponseValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CategoryApplicationService {

    private final CategoryService categoryService;
    private final UserServiceClient userServiceClient;
    private final TransactionServiceClient transactionServiceClient;

    public CategoryResponse createCategory(CategoryCreateRequest request, String email) {
        request.setUserSeq(resolveUserId(email));

        Category category = categoryService.createCategory(request);

        return CategoryResponse.builder()
                .name(category.getName())
                .description(category.getDescription())
                .color(category.getColor())
                .build();
    }

    public CategoryListResponse getCategories(CategoryListRequest request, Pageable pageable, String email) {
        request.setUserSeq(resolveUserId(email));

        Page<Category> categories = categoryService.getCategoriesByConditions(request, pageable);

        return CategoryListResponse.builder()
                .categories(categories.getContent().stream()
                        .map(CategoryListItemResponse::from)
                        .toList())
                .pageNumber(categories.getNumber())
                .pageSize(categories.getSize())
                .totalElements(categories.getTotalElements())
                .totalPages(categories.getTotalPages())
                .build();
    }

    public CategoryResponse updateCategory(Long id, CategoryUpdateRequest request, String email) {
        Long userId = resolveUserId(email);

        Category updatedCategory = categoryService.updateCategory(id, request, userId);

        return CategoryResponse.builder()
                .name(updatedCategory.getName())
                .description(updatedCategory.getDescription())
                .color(updatedCategory.getColor())
                .build();
    }

    public CategoryResponse getCategory(Long id, String email) {
        Long userId = resolveUserId(email);

        Category category = categoryService.getCategoryById(id, userId);

        return CategoryResponse.builder()
                .name(category.getName())
                .description(category.getDescription())
                .color(category.getColor())
                .build();
    }

    public void deleteCategory(Long id, String email, CategoryDeleteRequest request) {
        Long userId = resolveUserId(email);

        ExternalResponseValidator.requireData(
                transactionServiceClient.moveCategory(id, request.getReplaceCategoryId()),
                "transaction-service"
        );

        categoryService.deleteCategory(id, userId);
    }

    private Long resolveUserId(String email) {
        UserDto user = ExternalResponseValidator.requireData(userServiceClient.getUser(email), "user-service");
        return ExternalResponseValidator.requireField(user, UserDto::getId, "user-service", "user id");
    }
}
