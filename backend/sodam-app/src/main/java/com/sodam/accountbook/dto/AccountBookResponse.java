package com.sodam.accountbook.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AccountBookResponse {
    private Long id;
    private String name;
    private String updatedAt;
}
