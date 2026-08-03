package com.sodam.transaction.dto;

import lombok.*;
import java.math.BigDecimal;

@Data @NoArgsConstructor @AllArgsConstructor
public class StatResponse {
    private BigDecimal total;
    private String type;
    private String name;
}
