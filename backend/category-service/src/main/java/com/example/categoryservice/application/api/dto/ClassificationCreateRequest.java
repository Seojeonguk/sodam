package com.example.categoryservice.application.api.dto;

import lombok.Data;
import lombok.ToString;

@Data
@ToString
public class ClassificationCreateRequest {
    private String name;
    private Long accountBookSeq;
}
