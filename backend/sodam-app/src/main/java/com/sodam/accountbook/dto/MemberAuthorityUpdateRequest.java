package com.sodam.accountbook.dto;

import com.sodam.accountbook.domain.Authority;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MemberAuthorityUpdateRequest {
    @NotNull
    private Authority authority;
}
