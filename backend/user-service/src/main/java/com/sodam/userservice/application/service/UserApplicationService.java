package com.sodam.userservice.application.service;

import com.sodam.userservice.application.api.dto.LoginRequest;
import com.sodam.userservice.application.api.dto.LoginResponse;
import com.sodam.userservice.application.api.dto.RegisterRequest;
import com.sodam.userservice.application.api.dto.UserResponse;
import com.sodam.userservice.config.JwtTokenProvider;
import com.sodam.userservice.domain.model.Role;
import com.sodam.userservice.domain.model.User;
import com.sodam.userservice.domain.service.UserServiceImpl;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserApplicationService {

    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final UserServiceImpl userService;

    @Transactional
    public void registerNewUser(RegisterRequest registerRequest) {
        String encodedPassword = passwordEncoder.encode(registerRequest.getPassword());

        User newUser = User.builder()
                .email(registerRequest.getEmail())
                .password(encodedPassword)
                .name(registerRequest.getName())
                .role(Role.USER) // 기본 역할 부여
                .build();

        userService.registerNewUser(newUser);
    }

    @Transactional
    public LoginResponse login(LoginRequest loginRequest, HttpServletResponse response) {
        User user = userService.findUserByEmail(loginRequest.getEmail());

        // 2. 비밀번호 일치 여부 확인
        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("잘못된 비밀번호입니다.");
        }

        String accessToken = jwtTokenProvider.generateAccessToken(user.getEmail());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail());

        Cookie refreshCookie = new Cookie("refreshToken", refreshToken);
        refreshCookie.setHttpOnly(true);
        refreshCookie.setSecure(true); // HTTPS 환경 권장
        refreshCookie.setPath("/");
        refreshCookie.setMaxAge(7 * 24 * 60 * 60); // 7일
        response.addCookie(refreshCookie);

        return LoginResponse.builder()
                .accessToken(accessToken)
                .build();
    }

    @Transactional
    public User findUserById(Long userId) {
        return userService.findUserById(userId);
    }

    @Transactional
    public UserResponse findUserByEmail(String email) {
        User user = userService.findUserByEmail(email);
        return UserResponse.fromEntity(user);
    }

    @Transactional
    public User updateUser(User user) {
        return userService.updateUser(user);
    }

    @Transactional
    public void deleteUser(Long userId) {
        userService.deleteUser(userId);
    }

    @Transactional(readOnly = true)
    public String refresh(String userId) {
        return jwtTokenProvider.generateAccessToken(userId);
    }
}
