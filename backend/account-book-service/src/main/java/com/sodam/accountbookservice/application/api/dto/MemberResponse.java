package com.sodam.accountbookservice.application.api.dto;

import com.sodam.accountbookservice.domain.model.AccountBookMember;
import com.sodam.accountbookservice.infrastructure.UserDto;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MemberResponse {

    private Long userId;
    private String email;
    private String name;
    private String imageUrl;
    private String authority;   // OWNER | EDITOR | VIEWER
    private String joinedAt;

    public static MemberResponse of(AccountBookMember member, UserDto user) {
        return MemberResponse.builder()
                .userId(member.getUserId())
                .email(user != null ? user.getEmail() : null)
                .name(user != null ? user.getName() : "알 수 없음")
                .imageUrl(user != null ? user.getImageUrl() : null)
                .authority(member.getAuthority().name())
                .joinedAt(member.getCreatedAt())
                .build();
    }
}
