package com.sodam.category.dto;

import com.sodam.category.domain.Category;
import lombok.*;

@Data @Builder
public class CategoryListItemResponse {
    private Long id;
    private String name;
    private String description;
    private String color;
    private String type;

    public static CategoryListItemResponse from(Category c) {
        return CategoryListItemResponse.builder()
                .id(c.getId()).name(c.getName()).description(c.getDescription())
                .color(c.getColor()).type(c.getType()).build();
    }
}
