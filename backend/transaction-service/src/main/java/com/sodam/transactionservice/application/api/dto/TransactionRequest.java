package com.sodam.transactionservice.application.api.dto;

import com.sodam.transactionservice.domain.model.TransactionType;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionRequest {

    private Long accountBookSeq;

    private Long userSeq;

    private Long categorySeq;

    @NotNull(message = "거래 금액은 필수입니다.")
    @DecimalMin(value = "0.01", message = "거래 금액은 0보다 커야 합니다.")
    private BigDecimal amount;

    @Size(max = 255, message = "설명은 255자를 초과할 수 없습니다.")
    private String description;

    @NotNull(message = "거래 발생일은 필수입니다.")
    @PastOrPresent(message = "거래 발생일은 현재 또는 과거 날짜여야 합니다.")
    private LocalDate transactionDate;

    @NotNull(message = "거래 유형은 필수입니다.")
    private TransactionType type;

    @Min(value = 1, message = "만족도 평가는 1점 이상이어야 합니다.")
    @Max(value = 5, message = "만족도 평가는 5점 이하이어야 합니다.")
    private Integer satisfactionRating;
}
