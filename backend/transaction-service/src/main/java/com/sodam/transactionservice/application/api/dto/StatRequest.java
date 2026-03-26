package com.sodam.transactionservice.application.api.dto;

import lombok.Data;

@Data
public class StatRequest {
    private Long userSeq;
    private String startDate;
    private String endDate;
}
