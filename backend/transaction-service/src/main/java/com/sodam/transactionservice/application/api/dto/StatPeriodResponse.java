package com.sodam.transactionservice.application.api.dto;

import lombok.Data;

@Data
public class StatPeriodResponse {
    private Double total;
    private String type;
    private String transaction_date;
}
