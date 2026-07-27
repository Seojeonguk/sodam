package com.sodam.transactionservice.application.api.dto;

import lombok.Data;
import java.util.List;

@Data
public class StatPeriodRequest {
    private String startDate;
    private String endDate;
    private Long userSeq;
    /** 카테고리 다건 필터 (null 또는 빈 리스트이면 전체) */
    private List<Long> categorySeqs;
}
