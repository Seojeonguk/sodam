package com.sodam.userservice.application.api.controller;

import com.sodam.userservice.application.api.dto.LoginRequest;
import com.sodam.userservice.application.api.dto.LoginResponse;
import com.sodam.userservice.application.api.dto.RegisterRequest;
import com.sodam.userservice.application.service.UserApplicationService;
import com.sodam.userservice.common.api.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {


    private final UserApplicationService userService;


    @GetMapping("/refresh")
    public ResponseEntity<ApiResponse<String>> refresh(@RequestParam String userId) {
        String newToken = userService.refresh(userId);

        return ApiResponse.success("토큰 재발급이 완료되었습니다.", newToken);
    }

    /**
     * 이메일과 비밀번호를 사용하여 로그인합니다.
     *
     * @param loginRequest 로그인 요청 DTO (email, password)
     * @return JWT 토큰을 포함한 응답
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@RequestBody LoginRequest loginRequest) {
        LoginResponse user = userService.login(loginRequest);

        return ApiResponse.success(user);
    }

    /**
     * 로그아웃을 처리합니다.
     * 토큰 기반 인증에서는 클라이언트 측에서 토큰을 삭제하는 것이 핵심입니다.
     * 이 엔드포인트는 클라이언트에게 토큰 삭제를 유도하는 용도로 사용될 수 있습니다.
     *
     * @return 로그아웃 성공 메시지
     */
    @PostMapping("/logout")
    public ResponseEntity<String> logout() {
        // 실제 서버에서 할 일은 거의 없음.
        // 클라이언트는 이 응답을 받고 저장된 토큰을 제거하면 됨.
        return ResponseEntity.ok("로그아웃되었습니다. 클라이언트의 토큰을 삭제하세요.");
    }

    // --- 회원가입 기능 추가 ---

    /**
     * 새로운 사용자를 등록합니다.
     *
     * @param registerRequest 회원가입 요청 DTO (email, password, name)
     * @return 성공 메시지
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<String>> register(@RequestBody RegisterRequest registerRequest) {
        userService.registerNewUser(registerRequest);

       return ApiResponse.success("회원가입이 완료되었습니다.");
    }
}