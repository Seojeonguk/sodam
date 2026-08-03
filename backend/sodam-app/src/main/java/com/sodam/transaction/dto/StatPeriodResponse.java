package com.sodam.transaction.dto;

import lombok.*;
import java.math.BigDecimal;

@Data @NoArgsConstructor @AllArgsConstructor
public class StatPeriodResponse {
    private BigDecimal total;
    private String type;
    private String transactionDate;
}
