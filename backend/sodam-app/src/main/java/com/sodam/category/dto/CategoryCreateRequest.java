package com.sodam.category.dto;

import lombok.Data;

@Data
public class CategoryCreateRequest {
    private String name;
    private String description;
    private String color;
    private String type;
    private Long userSeq;
}
