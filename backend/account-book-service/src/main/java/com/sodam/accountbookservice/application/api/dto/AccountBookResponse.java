package com.sodam.accountbookservice.application.api.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AccountBookResponse {
    private String name;
    private String updatedAt;
}
