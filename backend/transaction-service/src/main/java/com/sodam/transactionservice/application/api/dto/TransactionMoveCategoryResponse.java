package com.sodam.transactionservice.application.api.dto;

import lombok.Data;

@Data
public class TransactionMoveCategoryResponse {
    private String code;
    private String message;
    private Integer data;
}
