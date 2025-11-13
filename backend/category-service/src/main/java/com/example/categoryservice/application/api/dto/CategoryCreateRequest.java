package com.example.categoryservice.application.api.dto;

import lombok.Data;

@Data
public class CategoryCreateRequest {
    private String name;
    private String description;
    private String color;
    private Long userSeq;
}
