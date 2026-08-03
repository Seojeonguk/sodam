package com.sodam.accountbookservice.application.api.dto;

import com.sodam.accountbookservice.domain.model.Authority;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MemberInviteRequest {

    @NotBlank
    @Email
    private String email;

    /** EDITOR 또는 VIEWER */
    @NotNull
    private Authority authority;
}
