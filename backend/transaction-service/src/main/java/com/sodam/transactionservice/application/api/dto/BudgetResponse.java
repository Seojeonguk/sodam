package com.sodam.transactionservice.application.api.dto;

import com.sodam.transactionservice.domain.model.Budget;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class BudgetResponse {
    private Long id;
    private Long accountBookSeq;
    private Long categorySeq;
    private String yearMonth;
    private BigDecimal amount;

    public static BudgetResponse from(Budget budget) {
        return BudgetResponse.builder()
                .id(budget.getId())
                .accountBookSeq(budget.getAccountBookSeq())
                .categorySeq(budget.getCategorySeq())
                .yearMonth(budget.getYearMonth())
                .amount(budget.getAmount())
                .build();
    }
}
