package com.example.categoryservice.application.api.dto;

import lombok.Data;

@Data
public class CategoryListRequest {
    private Integer page;
    private Integer limit;
    private Long userSeq;
    /** INCOME 또는 EXPENSE — null이면 전체 조회 */
    private String type;
}
