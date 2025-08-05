package com.sodam.userservice.application.api.controller;

import com.sodam.userservice.application.api.dto.LoginRequest;
import com.sodam.userservice.application.api.dto.RegisterRequest;
import com.sodam.userservice.application.service.UserApplicationService;
import com.sodam.userservice.config.JwtTokenProvider;
import com.sodam.userservice.domain.model.Role;
import com.sodam.userservice.domain.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserApplicationService userService;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/token")
    public String getToken(@RequestParam String userId) {
        return jwtTokenProvider.generateToken(userId);
    }

    /**
     * 이메일과 비밀번호를 사용하여 로그인합니다.
     *
     * @param loginRequest 로그인 요청 DTO (email, password)
     * @return JWT 토큰을 포함한 응답
     */
    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest loginRequest) {
        // 1. 이메일로 사용자 정보 조회
        User user = userService.findUserByEmail(loginRequest.getEmail());

        // 2. 비밀번호 일치 여부 확인
        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("잘못된 비밀번호입니다.");
        }

        // 3. JWT 토큰 생성 및 반환
        String token = jwtTokenProvider.generateToken(user.getEmail());
        return ResponseEntity.ok(token);
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
    public ResponseEntity<String> register(@RequestBody RegisterRequest registerRequest) {
        // 비밀번호를 암호화하여 저장
        String encodedPassword = passwordEncoder.encode(registerRequest.getPassword());

        User newUser = User.builder()
                .email(registerRequest.getEmail())
                .password(encodedPassword)
                .name(registerRequest.getName())
                .role(Role.USER) // 기본 역할 부여
                .build();

        userService.registerNewUser(newUser);

        return ResponseEntity.ok("회원가입이 완료되었습니다.");
    }
}