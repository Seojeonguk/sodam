package com.sodam.userservice.application.api.controller;

import com.sodam.common.response.ApiResponse;
import com.sodam.common.response.ResponseCode;
import com.sodam.userservice.application.api.dto.LoginRequest;
import com.sodam.userservice.application.api.dto.LoginResponse;
import com.sodam.userservice.application.api.dto.RegisterRequest;
import com.sodam.userservice.application.api.dto.UserResponse;
import com.sodam.userservice.application.service.UserApplicationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final UserApplicationService userService;

    @GetMapping("/refresh")
    public ApiResponse<String> refresh(@RequestParam String userId) {
        return ApiResponse.success("토큰 재발급이 완료되었습니다.", userService.refresh(userId));
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@RequestBody LoginRequest loginRequest, HttpServletResponse response) {
        return ApiResponse.success(userService.login(loginRequest, response));
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout() {
        return ResponseEntity.ok("로그아웃되었습니다. 클라이언트의 토큰을 삭제하세요.");
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<String>> register(@RequestBody RegisterRequest registerRequest) {
        userService.registerNewUser(registerRequest);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("회원가입이 완료되었습니다."));
    }

    @GetMapping("/users/{email}")
    public ApiResponse<UserResponse> getUser(@PathVariable String email) {
        return ApiResponse.success(userService.findUserByEmail(email));
    }

    @PostMapping("/reissue")
    public ResponseEntity<ApiResponse<LoginResponse>> reissue(HttpServletRequest request) {
        LoginResponse userInfo = userService.reissue(request);

        if (userInfo == null) {
            return ResponseEntity.ok(ApiResponse.fail(ResponseCode.UNAUTHORIZED.getCode(), "Refresh token이 유효하지 않습니다."));
        }

        return ResponseEntity.ok(ApiResponse.success(userInfo));
    }
}