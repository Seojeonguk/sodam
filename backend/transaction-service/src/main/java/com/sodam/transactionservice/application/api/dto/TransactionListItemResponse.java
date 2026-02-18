package com.sodam.transactionservice.application.api.dto;

import com.sodam.transactionservice.domain.model.Transaction;
import com.sodam.transactionservice.domain.model.TransactionType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Builder
public class TransactionListItemResponse {
    private Long seq;
    private BigDecimal amount;
    private String description;
    private String transactionDate;
    private TransactionType type;
    private String categoryName;

    public static TransactionListItemResponse from(Transaction transaction, String categoryName) {
        return TransactionListItemResponse.builder()
                .seq(transaction.getSeq())
                .amount(transaction.getAmount())
                .description(transaction.getDescription())
                .transactionDate(transaction.getTransactionDate())
                .type(transaction.getType())
                .categoryName(categoryName)
                .build();
    }
}
