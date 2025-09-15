package com.sodam.accountbookservice.application.api.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AccountBookUpdateRequest {
    private String name;

    @JsonIgnore
    private Long userId;
}
