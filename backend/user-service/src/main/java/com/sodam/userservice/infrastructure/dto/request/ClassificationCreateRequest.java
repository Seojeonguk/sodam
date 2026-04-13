package com.sodam.userservice.infrastructure.dto.request;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ClassificationCreateRequest {
    private Long accountBookSeq;
    private String name;
}
