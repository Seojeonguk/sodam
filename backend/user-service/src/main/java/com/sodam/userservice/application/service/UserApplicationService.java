package com.sodam.userservice.application.service;

import com.sodam.userservice.application.api.dto.LoginRequest;
import com.sodam.userservice.application.api.dto.LoginResponse;
import com.sodam.userservice.application.api.dto.RegisterRequest;
import com.sodam.userservice.application.api.dto.UserResponse;
import com.sodam.userservice.config.JwtTokenProvider;
import com.sodam.userservice.domain.model.Role;
import com.sodam.userservice.domain.model.User;
import com.sodam.userservice.domain.service.UserServiceImpl;
import com.sodam.userservice.infrastructure.clients.AccountBookServiceClient;
import com.sodam.userservice.infrastructure.dto.request.AccountBookCreateRequest;
import com.sodam.userservice.infrastructure.dto.response.AccountBookResponse;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserApplicationService {

    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final UserServiceImpl userService;

    private final AccountBookServiceClient accountBookServiceClient;

    @Transactional
    public void registerNewUser(RegisterRequest registerRequest) {
        // 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(registerRequest.getPassword());

        // 신규 유저 생성
        User newUser = registerRequest.toEntity(encodedPassword, Role.USER);
        User createdUser = userService.registerNewUser(newUser);
        log.info("신규 유저 생성 완료. id : {}, 이메일 : {}", createdUser.getId(), createdUser.getEmail());

        // 가계부 생성
        String accountBookName = "기본 가계부";
        AccountBookCreateRequest createRequest = AccountBookCreateRequest.builder()
                .name(accountBookName)
                .userId(createdUser.getId())
                .build();

        AccountBookResponse createdAccountBook = accountBookServiceClient.createAccountBook(createRequest);
        log.debug("가계부 응답 : {}", createdAccountBook);
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
        refreshCookie.setAttribute("SameSite", "None");
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

    @Transactional(readOnly = true)
    public LoginResponse reissue(HttpServletRequest request) {
        // 쿠키에서 refreshToken 추출
        String refreshToken = extractRefreshTokenFromCookie(request);

        if (refreshToken == null || !jwtTokenProvider.validateToken(refreshToken)) {
            log.error("유효하지 않은 토큰 정보. refresh token : {}", refreshToken);
            return null;
        }

        // refreshToken에서 이메일 추출
        String email = jwtTokenProvider.getUserEmail(refreshToken);

        // 유저 검증 (선택적)
        userService.findUserByEmail(email);

        // 새 accessToken 발급
        String newAccessToken = jwtTokenProvider.generateAccessToken(email);

        return LoginResponse.builder()
                .accessToken(newAccessToken)
                .build();
    }

    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) {
            log.error("쿠키 정보가 존재하지 않음.");
            return null;
        }

        for (Cookie cookie : request.getCookies()) {
            if ("refreshToken".equals(cookie.getName())) {
                return cookie.getValue();
            }
        }

        log.error("쿠키 내 refresh token 확인 불가.");
        return null;
    }
}
