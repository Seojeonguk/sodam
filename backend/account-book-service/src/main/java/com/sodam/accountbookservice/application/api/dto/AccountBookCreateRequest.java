package com.sodam.accountbookservice.application.api.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

@Data
public class AccountBookCreateRequest {
    private String name;

    private Long userId;
}
