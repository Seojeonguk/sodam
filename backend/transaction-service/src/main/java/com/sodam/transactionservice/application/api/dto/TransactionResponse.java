package com.sodam.transactionservice.application.api.dto;

import com.sodam.transactionservice.domain.model.Transaction;
import com.sodam.transactionservice.domain.model.TransactionType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionResponse {

    private Long seq;
    private Long accountBookSeq;
    private Long userSeq;
    private Long categorySeq;
    private BigDecimal amount;
    private String description;
    private LocalDate transactionDate;
    private TransactionType type;
    private Integer satisfactionRating;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static TransactionResponse from(Transaction transaction) {
        return TransactionResponse.builder()
                .seq(transaction.getSeq())
                .accountBookSeq(transaction.getAccountBookSeq())
                .userSeq(transaction.getUserSeq())
                .categorySeq(transaction.getCategorySeq())
                .amount(transaction.getAmount())
                .description(transaction.getDescription())
                .transactionDate(transaction.getTransactionDate())
                .type(transaction.getType())
                .satisfactionRating(transaction.getSatisfactionRating())
                .createdAt(transaction.getCreatedAt())
                .updatedAt(transaction.getUpdatedAt())
                .build();
    }
}
