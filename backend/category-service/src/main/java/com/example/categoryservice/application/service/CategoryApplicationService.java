package com.example.categoryservice.application.service;

import com.example.categoryservice.application.api.dto.*;
import com.example.categoryservice.domain.model.Category;
import com.example.categoryservice.domain.service.CategoryService;
import com.example.categoryservice.infrastructure.ApiResponse;
import com.example.categoryservice.infrastructure.UserDto;
import com.example.categoryservice.infrastructure.UserServiceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CategoryApplicationService {

    private final CategoryService categoryService;
    private final UserServiceClient userServiceClient;

    public CategoryResponse createCategory(CategoryCreateRequest request, String email) {
        ApiResponse<UserDto> userResponse = userServiceClient.getUser(email);

        Long id = userResponse.getData().getId();
        request.setUserSeq(id);

        Category category = categoryService.createCategory(request);

        return CategoryResponse.builder()
                .name(category.getName())
                .description(category.getDescription())
                .color(category.getColor())
                .build();
    }

    public CategoryListResponse getCategories(CategoryListRequest request, Pageable pageable, String email) {
        ApiResponse<UserDto> userResponse = userServiceClient.getUser(email);

        Long id = userResponse.getData().getId();
        request.setUserSeq(id);

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
        ApiResponse<UserDto> userResponse = userServiceClient.getUser(email);

        Long userId = userResponse.getData().getId();

        Category updatedCategory = categoryService.updateCategory(id, request, userId);

        return CategoryResponse.builder()
                .name(updatedCategory.getName())
                .description(updatedCategory.getDescription())
                .color(updatedCategory.getColor())
                .build();
    }

    public CategoryResponse getCategory(Long id, String email) {
        ApiResponse<UserDto> userResponse = userServiceClient.getUser(email);

        Long userId = userResponse.getData().getId();

        Category category = categoryService.getCategoryById(id, userId);

        return CategoryResponse.builder()
                .name(category.getName())
                .description(category.getDescription())
                .color(category.getColor())
                .build();
    }

    public void deleteCategory(Long id, String email) {
        ApiResponse<UserDto> userResponse = userServiceClient.getUser(email);

        Long userId = userResponse.getData().getId();

        categoryService.deleteCategory(id, userId);
    }
}
