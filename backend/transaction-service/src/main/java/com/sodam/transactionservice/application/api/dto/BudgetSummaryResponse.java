package com.sodam.transactionservice.application.api.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class BudgetSummaryResponse {
    /** null이면 예산 미설정 항목 */
    private Long budgetId;
    private Long categorySeq;
    private String categoryName;
    private String categoryColor;
    private String categoryType;
    /** 설정된 예산 금액 (미설정이면 0) */
    private BigDecimal budgetAmount;
    /** 해당 월 실제 지출/수입 금액 */
    private BigDecimal actualAmount;
    /** actualAmount / budgetAmount * 100 (예산 미설정이면 -1) */
    private double ratio;
    /** 예산 초과 여부 */
    private boolean over;
    /** 예산 설정 여부 */
    private boolean hasBudget;
}
