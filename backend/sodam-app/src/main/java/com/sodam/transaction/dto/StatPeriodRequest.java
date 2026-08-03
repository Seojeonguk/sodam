package com.sodam.transaction.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StatPeriodRequest {
    private Long userSeq;
    private String startDate;
    private String endDate;
    private List<Long> categorySeqs;
    private String keyword;
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
}
