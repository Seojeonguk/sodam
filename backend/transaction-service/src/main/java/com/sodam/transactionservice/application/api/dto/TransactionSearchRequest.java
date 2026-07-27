package com.sodam.transactionservice.application.api.dto;

import lombok.*;

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
}
