package com.example.accountbookservice.application.dto;

import com.example.accountbookservice.domain.accounbook.entity.AccountBookType;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AccountBookResponse {
    private Long seq;
    private String name;
    private AccountBookType type;
}
