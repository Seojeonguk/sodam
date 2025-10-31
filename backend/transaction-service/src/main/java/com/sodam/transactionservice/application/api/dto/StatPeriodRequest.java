package com.sodam.transactionservice.application.api.dto;

import lombok.Data;

@Data
public class StatPeriodRequest {
    private String startDate;
    private String endDate;

    private Long userSeq;
}
