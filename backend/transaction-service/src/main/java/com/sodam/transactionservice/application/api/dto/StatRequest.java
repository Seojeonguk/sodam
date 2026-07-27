package com.sodam.transactionservice.application.api.dto;

import lombok.Data;
import java.util.List;

@Data
public class StatRequest {
    private Long userSeq;
    private String startDate;
    private String endDate;
    /** 카테고리 다건 필터 (null 또는 빈 리스트이면 전체) */
    private List<Long> categorySeqs;
}
