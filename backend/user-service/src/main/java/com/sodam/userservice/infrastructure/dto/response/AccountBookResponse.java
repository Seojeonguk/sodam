package com.sodam.userservice.infrastructure.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AccountBookResponse {
    private String name;
    private LocalDateTime updatedAt;
}