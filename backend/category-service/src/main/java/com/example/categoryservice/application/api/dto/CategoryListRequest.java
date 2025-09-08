package com.example.categoryservice.application.api.dto;

import lombok.Data;

@Data
public class CategoryListRequest {
    private Integer page;
    private Integer limit;
    private Long userSeq;
}
