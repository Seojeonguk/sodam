package com.sodam.userservice.application.api.controller;

import com.sodam.common.response.ApiResponse;
import com.sodam.userservice.application.api.dto.UserResponse;
import com.sodam.userservice.application.service.UserApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/users")
@RequiredArgsConstructor
public class UserInternalController {

    private final UserApplicationService userService;

    @GetMapping("/{email}")
    public ApiResponse<UserResponse> getUser(@PathVariable String email) {
        return ApiResponse.success(userService.findUserByEmail(email));
    }
}
