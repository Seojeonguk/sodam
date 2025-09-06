package com.example.categoryservice.application.service;

import com.example.categoryservice.application.api.dto.CategoryCreateRequest;
import com.example.categoryservice.application.api.dto.CategoryResponse;
import com.example.categoryservice.domain.model.Category;
import com.example.categoryservice.domain.service.CategoryService;
import com.example.categoryservice.infrastructure.ApiResponse;
import com.example.categoryservice.infrastructure.UserDto;
import com.example.categoryservice.infrastructure.UserServiceClient;
import lombok.RequiredArgsConstructor;
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
}
