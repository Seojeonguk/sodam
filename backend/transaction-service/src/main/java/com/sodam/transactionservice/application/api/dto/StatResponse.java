package com.sodam.transactionservice.application.api.dto;

import lombok.Data;

@Data
public class StatResponse {
    private Double total;
    private String type;
    private String name;
}
