package com.sodam.transactionservice.application.api.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

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
    /** 카테고리 다건 필터 (null 또는 빈 리스트이면 전체) */
    private List<Long> categorySeqs;
    /** 설명 키워드 검색 (null이면 전체) */
    private String keyword;
    /** 최소 금액 (null이면 제한 없음) */
    private BigDecimal minAmount;
    /** 최대 금액 (null이면 제한 없음) */
    private BigDecimal maxAmount;
}
