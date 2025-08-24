package com.sodam.transactionservice.application.api.dto;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionSearchRequest {
    private Long userId;
    private Long accountBookSeq;
    private LocalDate startDate;
    private LocalDate endDate;
}
