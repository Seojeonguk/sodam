package com.sodam.transaction.dto;

import com.sodam.transaction.domain.Transaction;
import com.sodam.transaction.domain.TransactionType;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TransactionResponse {
    private Long seq;
    private Long accountBookSeq;
    private Long userSeq;
    private Long categorySeq;
    private BigDecimal amount;
    private String description;
    private String transactionDate;
    private TransactionType type;
    private Integer satisfactionRating;
    private String createdAt;
    private String updatedAt;

    public static TransactionResponse from(Transaction t) {
        return TransactionResponse.builder()
                .seq(t.getSeq()).accountBookSeq(t.getAccountBookSeq()).userSeq(t.getUserSeq())
                .categorySeq(t.getCategorySeq()).amount(t.getAmount()).description(t.getDescription())
                .transactionDate(t.getTransactionDate()).type(t.getType())
                .satisfactionRating(t.getSatisfactionRating())
                .createdAt(t.getCreatedAt()).updatedAt(t.getUpdatedAt()).build();
    }
}
