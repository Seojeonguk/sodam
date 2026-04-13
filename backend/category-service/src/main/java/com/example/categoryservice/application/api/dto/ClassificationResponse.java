package com.example.categoryservice.application.api.dto;

import com.example.categoryservice.domain.model.Classification;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ClassificationResponse {
    private Long id;
    private String name;

    public static ClassificationResponse from(Classification classification) {
        return ClassificationResponse.builder()
                .id(classification.getId())
                .name(classification.getName())
                .build();
    }
}
