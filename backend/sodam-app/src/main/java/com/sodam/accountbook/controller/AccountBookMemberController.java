package com.sodam.accountbook.controller;

import com.sodam.accountbook.dto.*;
import com.sodam.accountbook.service.AccountBookMemberApplicationService;
import com.sodam.common.response.ApiResponse;
import com.sodam.common.security.CurrentUser;
import com.sodam.common.security.UserContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/account-books/{accountBookId}/members")
@RequiredArgsConstructor
public class AccountBookMemberController {

    private final AccountBookMemberApplicationService service;

    @GetMapping
    public ApiResponse<List<MemberResponse>> list(
            @PathVariable Long accountBookId,
            @CurrentUser UserContext userContext
    ) {
        return ApiResponse.success(service.getMembers(accountBookId, userContext.email()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MemberResponse>> invite(
            @PathVariable Long accountBookId,
            @RequestBody MemberInviteRequest request,
            @CurrentUser UserContext userContext
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(service.inviteMember(accountBookId, request, userContext.email())));
    }

    @PutMapping("/{userId}")
    public ApiResponse<MemberResponse> updateAuthority(
            @PathVariable Long accountBookId,
            @PathVariable Long userId,
            @RequestBody MemberAuthorityUpdateRequest request,
            @CurrentUser UserContext userContext
    ) {
        return ApiResponse.success(service.updateAuthority(accountBookId, userId, request, userContext.email()));
    }

    @DeleteMapping("/{userId}")
    public ApiResponse<Void> remove(
            @PathVariable Long accountBookId,
            @PathVariable Long userId,
            @CurrentUser UserContext userContext
    ) {
        service.removeMember(accountBookId, userId, userContext.email());
        return ApiResponse.success(null);
    }
}
