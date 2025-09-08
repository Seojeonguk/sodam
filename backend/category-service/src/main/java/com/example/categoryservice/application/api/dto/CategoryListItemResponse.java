package com.example.categoryservice.application.api.dto;

import com.example.categoryservice.domain.model.Category;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CategoryListItemResponse {
    private Long id;
    private String name;
    private String description;
    private String color;

    public static CategoryListItemResponse from(Category category) {
        return CategoryListItemResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .color(category.getColor())
                .build();
    }
}
