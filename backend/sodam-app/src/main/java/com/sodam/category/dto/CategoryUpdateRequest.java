package com.sodam.category.dto;

import lombok.Data;

@Data
public class CategoryUpdateRequest {
    private String name;
    private String description;
    private String color;
    private String type;
}
