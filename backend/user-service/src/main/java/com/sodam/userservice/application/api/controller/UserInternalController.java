package com.sodam.userservice.application.api.controller;

import com.sodam.common.response.ApiResponse;
import com.sodam.userservice.application.api.dto.UserResponse;
import com.sodam.userservice.application.service.UserApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/internal/users")
@RequiredArgsConstructor
public class UserInternalController {

    private final UserApplicationService userService;

    @GetMapping("/{email}")
    public ApiResponse<UserResponse> getUser(@PathVariable String email) {
        return ApiResponse.success(userService.findUserByEmail(email));
    }

    /** 여러 userId로 유저 정보 일괄 조회 (멤버 목록 표시용) */
    @PostMapping("/batch")
    public ApiResponse<List<UserResponse>> getUsersByIds(@RequestBody List<Long> userIds) {
        return ApiResponse.success(userService.findUsersByIds(userIds));
    }
}
