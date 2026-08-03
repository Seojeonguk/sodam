package com.sodam.transaction.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.sodam.transaction.domain.TransactionType;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TransactionRequest {
    private Long accountBookSeq;
    @JsonIgnore private Long userSeq;
    private Long categorySeq;
    @NotNull @DecimalMin("0.01") private BigDecimal amount;
    @Size(max = 255) private String description;
    @NotNull private String transactionDate;
    @NotNull private TransactionType type;
    @Min(1) @Max(5) private Integer satisfactionRating;
}
