package com.sodam.accountbookservice.application.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AccountBookListResponse {
    private Long id;
    private String name;
    private Integer isOwner;
    private Integer canEdit;
}
