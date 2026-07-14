package com.example.categoryservice.application.api.dto;

import lombok.Data;

@Data
public class CategoryUpdateRequest {
    private String name;
    private String description;
    private String color;
    /** INCOME 또는 EXPENSE */
    private String type;
}
