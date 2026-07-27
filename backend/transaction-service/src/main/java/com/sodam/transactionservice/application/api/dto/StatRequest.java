package com.sodam.transactionservice.application.api.dto;

import lombok.Data;

@Data
public class StatRequest {
    private Long userSeq;
    private String startDate;
    private String endDate;
    /** 카테고리 필터 (null이면 전체) */
    private Long categorySeq;
}
