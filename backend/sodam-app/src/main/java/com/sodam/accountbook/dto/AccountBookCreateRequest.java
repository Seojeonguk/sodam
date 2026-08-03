package com.sodam.accountbook.dto;

import lombok.Data;

@Data
public class AccountBookCreateRequest {
    private String name;
    private Long userId;
}
