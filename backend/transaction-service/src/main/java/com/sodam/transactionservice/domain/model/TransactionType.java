package com.sodam.transactionservice.domain.model;

import lombok.Getter;

@Getter
public enum TransactionType {
    INCOME("수입"),
    EXPENSE("지출");

    private final String description;

    TransactionType(String description) {
        this.description = description;
    }
}
