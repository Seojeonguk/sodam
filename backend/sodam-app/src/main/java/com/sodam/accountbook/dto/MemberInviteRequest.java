package com.sodam.accountbook.dto;

import com.sodam.accountbook.domain.Authority;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MemberInviteRequest {
    @NotBlank @Email
    private String email;
    @NotNull
    private Authority authority;
}
