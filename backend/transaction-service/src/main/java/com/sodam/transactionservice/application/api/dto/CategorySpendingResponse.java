package com.sodam.transactionservice.application.api.dto;

import lombok.Data;

import java.math.BigDecimal;

/** 예산 요약용: 카테고리별 실지출/수입 집계 */
@Data
public class CategorySpendingResponse {
    private Long categorySeq;
    private String type;
    private BigDecimal total;
}
