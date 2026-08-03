package com.sodam.transaction.dto;

import lombok.*;
import java.math.BigDecimal;

@Data @NoArgsConstructor @AllArgsConstructor
public class CategorySpendingResponse {
    private Long categorySeq;
    private String type;
    private BigDecimal total;
}
