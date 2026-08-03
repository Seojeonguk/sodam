package com.sodam.userservice.application.service;

import com.sodam.userservice.application.api.dto.LoginRequest;
import com.sodam.userservice.application.api.dto.LoginResponse;
import com.sodam.userservice.application.api.dto.RegisterRequest;
import com.sodam.userservice.application.api.dto.UserResponse;
import java.util.List;
import com.sodam.userservice.config.JwtTokenProvider;
import com.sodam.userservice.domain.model.Role;
import com.sodam.userservice.domain.model.User;
import com.sodam.userservice.domain.service.UserServiceImpl;
import com.sodam.userservice.infrastructure.clients.AccountBookServiceClient;
import com.sodam.userservice.infrastructure.clients.ClassificationServiceClient;
import com.sodam.userservice.infrastructure.dto.request.AccountBookCreateRequest;
import com.sodam.userservice.infrastructure.dto.request.ClassificationCreateRequest;
import com.sodam.userservice.infrastructure.dto.response.AccountBookResponse;
import com.sodam.userservice.infrastructure.dto.response.ClassificationResponse;
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

    private static final String REFRESH_TOKEN_COOKIE_NAME = "refreshToken";
    private static final int REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final UserServiceImpl userService;
    private final AccountBookServiceClient accountBookServiceClient;
    private final ClassificationServiceClient classificationServiceClient;

    @Transactional
    public void registerNewUser(RegisterRequest registerRequest) {
        String encodedPassword = passwordEncoder.encode(registerRequest.getPassword());
        User newUser = registerRequest.toEntity(encodedPassword, Role.USER);
        User createdUser = userService.registerNewUser(newUser);

        log.info("신규 유저 생성 완료. id: {}, email: {}", createdUser.getId(), createdUser.getEmail());

        AccountBookCreateRequest createRequest = AccountBookCreateRequest.builder()
                .name("가계부")
                .userId(createdUser.getId())
                .build();

        AccountBookResponse createdAccountBook = accountBookServiceClient.createAccountBook(createRequest);
        log.debug("가계부 생성 응답: {}", createdAccountBook);

        ClassificationCreateRequest incomeRequest = ClassificationCreateRequest.builder()
                .name("INCOME")
                .accountBookSeq(createdAccountBook.getId())
                .build();
        ClassificationResponse createdIncome = classificationServiceClient.createType(incomeRequest);
        log.debug("기본 수입 유형 생성 응답: {}", createdIncome);

        ClassificationCreateRequest expenseRequest = ClassificationCreateRequest.builder()
                .name("EXPENSE")
                .accountBookSeq(createdAccountBook.getId())
                .build();
        ClassificationResponse createdExpense = classificationServiceClient.createType(expenseRequest);
        log.debug("기본 지출 유형 생성 응답: {}", createdExpense);
    }

    @Transactional
    public LoginResponse login(LoginRequest loginRequest, HttpServletResponse response) {
        User user = userService.findUserByEmail(loginRequest.getEmail());

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("잘못된 비밀번호입니다.");
        }

        String accessToken = jwtTokenProvider.generateAccessToken(user.getEmail());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail());

        addRefreshTokenCookie(response, refreshToken);

        return LoginResponse.builder()
                .accessToken(accessToken)
                .build();
    }

    @Transactional
    public User findUserById(Long userId) {
        return userService.findUserById(userId);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> findUsersByIds(List<Long> ids) {
        return userService.findUsersByIds(ids).stream()
                .map(UserResponse::fromEntity)
                .toList();
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
        String refreshToken = extractRefreshTokenFromCookie(request);

        if (refreshToken == null || !jwtTokenProvider.validateToken(refreshToken)) {
            log.error("유효하지 않은 refresh token 입니다. token: {}", refreshToken);
            return null;
        }

        String email = jwtTokenProvider.getUserEmail(refreshToken);
        userService.findUserByEmail(email);

        String newAccessToken = jwtTokenProvider.generateAccessToken(email);

        return LoginResponse.builder()
                .accessToken(newAccessToken)
                .build();
    }

    @Transactional
    public void logout(HttpServletResponse response) {
        Cookie refreshCookie = new Cookie(REFRESH_TOKEN_COOKIE_NAME, "");
        refreshCookie.setHttpOnly(true);
        refreshCookie.setSecure(true);
        refreshCookie.setPath("/");
        refreshCookie.setMaxAge(0);
        refreshCookie.setAttribute("SameSite", "None");
        response.addCookie(refreshCookie);
    }

    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) {
            log.error("쿠키 정보가 존재하지 않습니다.");
            return null;
        }

        for (Cookie cookie : request.getCookies()) {
            if (REFRESH_TOKEN_COOKIE_NAME.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }

        log.error("refresh token 쿠키를 찾지 못했습니다.");
        return null;
    }

    private void addRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        Cookie refreshCookie = new Cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken);
        refreshCookie.setHttpOnly(true);
        refreshCookie.setSecure(true);
        refreshCookie.setPath("/");
        refreshCookie.setMaxAge(REFRESH_TOKEN_MAX_AGE);
        refreshCookie.setAttribute("SameSite", "None");
        response.addCookie(refreshCookie);
    }
}
