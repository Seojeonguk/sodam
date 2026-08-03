package com.sodam.transaction.dto;

import lombok.*;
import java.math.BigDecimal;

@Data @Builder
public class BudgetSummaryResponse {
    private Long budgetId;
    private Long categorySeq;
    private String categoryName;
    private String categoryColor;
    private String categoryType;
    private BigDecimal budgetAmount;
    private BigDecimal actualAmount;
    private double ratio;
    private boolean over;
    private boolean hasBudget;
}
