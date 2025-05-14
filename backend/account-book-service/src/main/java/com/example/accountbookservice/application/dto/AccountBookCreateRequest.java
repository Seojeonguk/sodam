package com.example.accountbookservice.application.dto;

import com.example.accountbookservice.domain.accounbook.entity.AccountBookType;
import lombok.Getter;

@Getter
public class AccountBookCreateRequest {
    private String name;
    private AccountBookType type;  // PERSONAL, SHARED
}
