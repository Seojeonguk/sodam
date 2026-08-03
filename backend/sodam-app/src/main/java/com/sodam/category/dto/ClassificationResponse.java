package com.sodam.category.dto;

import com.sodam.category.domain.Classification;
import lombok.*;

@Data @Builder
public class ClassificationResponse {
    private Long id;
    private String name;

    public static ClassificationResponse from(Classification c) {
        return ClassificationResponse.builder().id(c.getId()).name(c.getName()).build();
    }
}
