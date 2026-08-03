package com.sodam.transaction.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class BudgetRequest {
    private Long accountBookSeq;
    private Long categorySeq;
    private String settingDay;
    private BigDecimal amount;
}
