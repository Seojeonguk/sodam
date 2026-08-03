package com.sodam.user.controller;

import com.sodam.common.response.ApiResponse;
import com.sodam.common.security.CurrentUser;
import com.sodam.common.security.UserContext;
import com.sodam.user.dto.UserResponse;
import com.sodam.user.service.UserApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserApplicationService userService;

    /**
     * 현재 로그인된 사용자 정보 조회.
     * syncUser는 UserContextArgumentResolver에서 이미 처리됨.
     */
    @GetMapping("/me")
    public ApiResponse<UserResponse> me(@CurrentUser UserContext userContext) {
        return ApiResponse.success(userService.findUserByEmail(userContext.email()));
    }

    @DeleteMapping("/me")
    public ApiResponse<Void> deleteAccount(@CurrentUser UserContext userContext) {
        userService.deleteUser(userContext.email());
        return ApiResponse.success(null);
    }
}
