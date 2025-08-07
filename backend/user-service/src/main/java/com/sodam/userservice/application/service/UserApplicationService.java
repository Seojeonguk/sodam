package com.sodam.userservice.application.service;

import com.sodam.userservice.application.api.dto.LoginRequest;
import com.sodam.userservice.application.api.dto.LoginResponse;
import com.sodam.userservice.application.api.dto.RegisterRequest;
import com.sodam.userservice.common.exception.UserNotFoundException;
import com.sodam.userservice.config.JwtTokenProvider;
import com.sodam.userservice.domain.model.Role;
import com.sodam.userservice.domain.model.User;
import com.sodam.userservice.domain.service.UserServiceImpl;
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

        User user = userService.registerNewUser(newUser);

        if(user == null) {
            throw new UserNotFoundException("회원가입 이후 대상자 정보를 찾을 수 없습니다.");
        }

        //return userService.registerNewUser(newUser);
    }

    @Transactional
    public LoginResponse login(LoginRequest loginRequest) {
        User user = userService.findUserByEmail(loginRequest.getEmail());

        // 2. 비밀번호 일치 여부 확인
        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("잘못된 비밀번호입니다.");
        }

        String accessToken = jwtTokenProvider.generateToken(user.getEmail());
        String refreshToken = jwtTokenProvider.generateToken(user.getEmail());

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    @Transactional
    public User findUserById(Long userId) {
        return userService.findUserById(userId);
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
        return jwtTokenProvider.generateToken(userId);
    }
}
