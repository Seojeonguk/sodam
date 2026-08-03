package com.sodam.category.dto;

import lombok.Data;

@Data
public class CategoryListRequest {
    private Integer page;
    private Integer limit;
    private Long userSeq;
    private String type;
}
