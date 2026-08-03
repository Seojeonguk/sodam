package com.sodam.transaction.dto;

import com.sodam.transaction.domain.Budget;
import lombok.*;
import java.math.BigDecimal;

@Data @Builder
public class BudgetResponse {
    private Long id;
    private Long accountBookSeq;
    private Long categorySeq;
    private String settingDay;
    private BigDecimal amount;

    public static BudgetResponse from(Budget b) {
        return BudgetResponse.builder()
                .id(b.getId()).accountBookSeq(b.getAccountBookSeq())
                .categorySeq(b.getCategorySeq()).settingDay(b.getSettingDay()).amount(b.getAmount()).build();
    }
}
