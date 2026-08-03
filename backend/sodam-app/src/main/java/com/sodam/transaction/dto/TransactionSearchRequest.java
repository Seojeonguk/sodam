package com.sodam.transaction.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TransactionSearchRequest {
    private Long userId;
    private Long accountBookSeq;
    private String startDate;
    private String endDate;
    private List<Long> categorySeqs;
    private String keyword;
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
}
