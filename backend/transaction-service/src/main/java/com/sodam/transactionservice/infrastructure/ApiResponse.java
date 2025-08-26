package com.sodam.transactionservice.infrastructure;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Setter
@Getter
@RequiredArgsConstructor
@ToString
public class ApiResponse<T> {
    private final String code;
    private final String message;
    private final T data;
}
