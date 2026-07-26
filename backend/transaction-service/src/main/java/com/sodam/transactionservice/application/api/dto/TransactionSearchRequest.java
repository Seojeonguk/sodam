package com.sodam.transactionservice.application.api.dto;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionSearchRequest {
    private Long userId;
    private Long accountBookSeq;
    private String startDate;
    private String endDate;
    /** 카테고리 필터 (null이면 전체) */
    private Long categorySeq;
}
