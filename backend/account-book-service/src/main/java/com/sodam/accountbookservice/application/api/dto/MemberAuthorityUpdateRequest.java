package com.sodam.accountbookservice.application.api.dto;

import com.sodam.accountbookservice.domain.model.Authority;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MemberAuthorityUpdateRequest {

    /** EDITOR 또는 VIEWER (OWNER로 변경 불가) */
    @NotNull
    private Authority authority;
}
