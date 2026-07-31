package com.sodam.transactionservice.application.api.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class BudgetRequest {
    private Long accountBookSeq;
    private Long categorySeq;
    /** YYYYMM */
    private String yearMonth;
    private BigDecimal amount;
}
