package com.sodam.transactionservice.infrastructure;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CategoryListItemResponse {
    private Long id;
    private String name;
    private String description;
    private String color;
}
