package com.sodam.category.dto;

import lombok.*;

@Data @Builder
public class CategoryResponse {
    private String name;
    private String description;
    private String color;
    private String type;
}
