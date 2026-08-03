package com.sodam.transaction.dto;

import com.sodam.transaction.domain.TransactionType;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class RecurringTransactionRequest {
    @NotNull private Long accountBookSeq;
    private Long categorySeq;
    @NotNull @DecimalMin("0.01") private BigDecimal amount;
    private String description;
    @NotNull private TransactionType type;
    @NotNull @Min(1) @Max(31) private Integer dayOfMonth;
}
