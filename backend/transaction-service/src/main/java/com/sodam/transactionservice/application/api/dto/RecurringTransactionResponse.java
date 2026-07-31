package com.sodam.transactionservice.application.api.dto;

import com.sodam.transactionservice.domain.model.RecurringTransaction;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class RecurringTransactionResponse {

    private Long id;
    private Long accountBookSeq;
    private Long categorySeq;
    private String categoryName;
    private BigDecimal amount;
    private String description;
    private String type;
    private Integer dayOfMonth;
    private Boolean isActive;
    private String createdAt;

    public static RecurringTransactionResponse from(RecurringTransaction r, String categoryName) {
        return RecurringTransactionResponse.builder()
                .id(r.getId())
                .accountBookSeq(r.getAccountBookSeq())
                .categorySeq(r.getCategorySeq())
                .categoryName(categoryName)
                .amount(r.getAmount())
                .description(r.getDescription())
                .type(r.getType().name())
                .dayOfMonth(r.getDayOfMonth())
                .isActive(r.getIsActive())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
