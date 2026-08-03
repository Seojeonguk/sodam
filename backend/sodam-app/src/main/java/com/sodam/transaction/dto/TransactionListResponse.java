package com.sodam.transaction.dto;

import lombok.*;
import java.util.List;

@Getter @Builder
public class TransactionListResponse {
    private List<TransactionListItemResponse> transactions;
    private int pageNumber;
    private int pageSize;
    private long totalElements;
    private int totalPages;
}
