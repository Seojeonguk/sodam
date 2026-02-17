package com.sodam.userservice.infrastructure.dto.request;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AccountBookCreateRequest {
    private Long userId;
    private String name;
}
