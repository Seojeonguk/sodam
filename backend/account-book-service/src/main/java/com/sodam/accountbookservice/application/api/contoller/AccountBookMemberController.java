package com.sodam.accountbookservice.application.api.contoller;

import com.sodam.accountbookservice.application.api.dto.MemberAuthorityUpdateRequest;
import com.sodam.accountbookservice.application.api.dto.MemberInviteRequest;
import com.sodam.accountbookservice.application.api.dto.MemberResponse;
import com.sodam.accountbookservice.application.service.AccountBookMemberApplicationService;
import com.sodam.common.response.ApiResponse;
import com.sodam.common.security.CurrentUser;
import com.sodam.common.security.UserContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/account-books/{accountBookId}/members")
@RequiredArgsConstructor
@Slf4j
public class AccountBookMemberController {

    private final AccountBookMemberApplicationService service;

    /** 멤버 목록 조회 */
    @GetMapping
    public ApiResponse<List<MemberResponse>> getMembers(
            @PathVariable Long accountBookId,
            @CurrentUser UserContext userContext
    ) {
        return ApiResponse.success(service.getMembers(accountBookId, userContext.email()));
    }

    /** 멤버 초대 (OWNER 전용) */
    @PostMapping
    public ResponseEntity<ApiResponse<MemberResponse>> inviteMember(
            @PathVariable Long accountBookId,
            @Valid @RequestBody MemberInviteRequest request,
            @CurrentUser UserContext userContext
    ) {
        MemberResponse response = service.inviteMember(accountBookId, request, userContext.email());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    /** 멤버 권한 변경 (OWNER 전용) */
    @PatchMapping("/{userId}")
    public ApiResponse<MemberResponse> updateAuthority(
            @PathVariable Long accountBookId,
            @PathVariable Long userId,
            @Valid @RequestBody MemberAuthorityUpdateRequest request,
            @CurrentUser UserContext userContext
    ) {
        return ApiResponse.success(service.updateAuthority(accountBookId, userId, request, userContext.email()));
    }

    /** 멤버 삭제 (OWNER 전용) */
    @DeleteMapping("/{userId}")
    public ApiResponse<Void> removeMember(
            @PathVariable Long accountBookId,
            @PathVariable Long userId,
            @CurrentUser UserContext userContext
    ) {
        service.removeMember(accountBookId, userId, userContext.email());
        return ApiResponse.success(null);
    }
}
