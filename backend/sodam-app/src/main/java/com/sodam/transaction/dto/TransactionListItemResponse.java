package com.sodam.transaction.dto;

import com.sodam.transaction.domain.Transaction;
import com.sodam.transaction.domain.TransactionType;
import lombok.*;
import java.math.BigDecimal;

@Getter @Builder
public class TransactionListItemResponse {
    private Long seq;
    private BigDecimal amount;
    private String description;
    private String transactionDate;
    private TransactionType type;
    private String categoryName;

    public static TransactionListItemResponse from(Transaction t, String categoryName) {
        return TransactionListItemResponse.builder()
                .seq(t.getSeq()).amount(t.getAmount()).description(t.getDescription())
                .transactionDate(t.getTransactionDate()).type(t.getType()).categoryName(categoryName).build();
    }
}
