package com.sodam.transactionservice.application.api.dto;

import com.sodam.transactionservice.domain.model.TransactionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class RecurringTransactionRequest {

    @NotNull
    private Long accountBookSeq;

    private Long categorySeq;

    @NotNull
    @DecimalMin(value = "0.01", message = "금액은 0보다 커야 합니다.")
    private BigDecimal amount;

    private String description;

    @NotNull
    private TransactionType type;

    @NotNull
    @Min(value = 1, message = "날짜는 1 이상이어야 합니다.")
    @Max(value = 31, message = "날짜는 31 이하여야 합니다.")
    private Integer dayOfMonth;
}
