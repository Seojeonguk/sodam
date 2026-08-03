package com.sodam.category.dto;

import lombok.Data;

@Data
public class ClassificationCreateRequest {
    private String name;
    private Long accountBookSeq;
}
