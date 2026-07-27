package com.sodam.transactionservice.application.api.dto;

import lombok.Data;

@Data
public class StatPeriodRequest {
    private String startDate;
    private String endDate;
    private Long userSeq;
    /** 카테고리 필터 (null이면 전체) */
    private Long categorySeq;
}
