package com.sodam.userservice.application.service;

import com.sodam.userservice.application.api.dto.LoginRequest;
import com.sodam.userservice.application.api.dto.LoginResponse;
import com.sodam.userservice.application.api.dto.RegisterRequest;
import com.sodam.userservice.config.JwtTokenProvider;
import com.sodam.userservice.domain.model.Role;
import com.sodam.userservice.domain.model.User;
import com.sodam.userservice.domain.service.UserServiceImpl;
import com.sodam.userservice.infrastructure.clients.AccountBookServiceClient;
import com.sodam.userservice.infrastructure.clients.ClassificationServiceClient;
import com.sodam.userservice.infrastructure.dto.request.AccountBookCreateRequest;
import com.sodam.userservice.infrastructure.dto.request.ClassificationCreateRequest;
import com.sodam.userservice.infrastructure.dto.response.AccountBookResponse;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserApplicationServiceTest {

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private UserServiceImpl userService;

    @Mock
    private AccountBookServiceClient accountBookServiceClient;

    @Mock
    private ClassificationServiceClient classificationServiceClient;

    @InjectMocks
    private UserApplicationService userApplicationService;

    @Test
    @DisplayName("register creates default account book and classifications")
    void registerNewUser_createsDefaultAccountBookAndClassifications() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("user@example.com");
        request.setPassword("plain-password");
        request.setName("tester");

        User createdUser = User.builder()
                .id(1L)
                .email("user@example.com")
                .name("tester")
                .password("encoded-password")
                .role(Role.USER)
                .build();

        AccountBookResponse accountBookResponse = new AccountBookResponse();
        accountBookResponse.setId(99L);
        accountBookResponse.setName("account-book");

        when(passwordEncoder.encode("plain-password")).thenReturn("encoded-password");
        when(userService.registerNewUser(any(User.class))).thenReturn(createdUser);
        when(accountBookServiceClient.createAccountBook(any(AccountBookCreateRequest.class)))
                .thenReturn(accountBookResponse);

        userApplicationService.registerNewUser(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userService).registerNewUser(userCaptor.capture());
        assertThat(userCaptor.getValue().getEmail()).isEqualTo("user@example.com");
        assertThat(userCaptor.getValue().getPassword()).isEqualTo("encoded-password");
        assertThat(userCaptor.getValue().getRole()).isEqualTo(Role.USER);

        ArgumentCaptor<AccountBookCreateRequest> accountBookCaptor =
                ArgumentCaptor.forClass(AccountBookCreateRequest.class);
        verify(accountBookServiceClient).createAccountBook(accountBookCaptor.capture());
        assertThat(accountBookCaptor.getValue().getUserId()).isEqualTo(1L);

        ArgumentCaptor<ClassificationCreateRequest> classificationCaptor =
                ArgumentCaptor.forClass(ClassificationCreateRequest.class);
        verify(classificationServiceClient, times(2)).createType(classificationCaptor.capture());
        assertThat(classificationCaptor.getAllValues())
                .extracting(ClassificationCreateRequest::getName)
                .containsExactly("INCOME", "EXPENSE");
    }

    @Test
    @DisplayName("login returns access token and refresh cookie")
    void login_returnsAccessTokenAndSetsRefreshCookie() {
        LoginRequest request = new LoginRequest();
        request.setEmail("user@example.com");
        request.setPassword("plain-password");

        User user = User.builder()
                .email("user@example.com")
                .password("encoded-password")
                .build();

        MockHttpServletResponse response = new MockHttpServletResponse();

        when(userService.findUserByEmail("user@example.com")).thenReturn(user);
        when(passwordEncoder.matches("plain-password", "encoded-password")).thenReturn(true);
        when(jwtTokenProvider.generateAccessToken("user@example.com")).thenReturn("access-token");
        when(jwtTokenProvider.generateRefreshToken("user@example.com")).thenReturn("refresh-token");

        LoginResponse loginResponse = userApplicationService.login(request, response);

        assertThat(loginResponse.getAccessToken()).isEqualTo("access-token");
        Cookie refreshCookie = response.getCookie("refreshToken");
        assertThat(refreshCookie).isNotNull();
        assertThat(refreshCookie.getValue()).isEqualTo("refresh-token");
        assertThat(refreshCookie.isHttpOnly()).isTrue();
        assertThat(refreshCookie.getMaxAge()).isPositive();
    }

    @Test
    @DisplayName("login throws when password does not match")
    void login_throwsWhenPasswordDoesNotMatch() {
        LoginRequest request = new LoginRequest();
        request.setEmail("user@example.com");
        request.setPassword("wrong-password");

        User user = User.builder()
                .email("user@example.com")
                .password("encoded-password")
                .build();

        when(userService.findUserByEmail("user@example.com")).thenReturn(user);
        when(passwordEncoder.matches("wrong-password", "encoded-password")).thenReturn(false);

        assertThatThrownBy(() -> userApplicationService.login(request, new MockHttpServletResponse()))
                .isInstanceOf(IllegalArgumentException.class);

        verify(jwtTokenProvider, never()).generateAccessToken(any());
        verify(jwtTokenProvider, never()).generateRefreshToken(any());
    }

    @Test
    @DisplayName("reissue returns new access token for valid refresh token")
    void reissue_returnsNewAccessTokenWhenRefreshTokenIsValid() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie("refreshToken", "valid-refresh-token"));

        when(jwtTokenProvider.validateToken("valid-refresh-token")).thenReturn(true);
        when(jwtTokenProvider.getUserEmail("valid-refresh-token")).thenReturn("user@example.com");
        when(jwtTokenProvider.generateAccessToken("user@example.com")).thenReturn("new-access-token");
        when(userService.findUserByEmail("user@example.com"))
                .thenReturn(User.builder().email("user@example.com").build());

        LoginResponse response = userApplicationService.reissue(request);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("new-access-token");
    }

    @Test
    @DisplayName("reissue returns null for invalid refresh token")
    void reissue_returnsNullWhenRefreshTokenIsInvalid() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie("refreshToken", "invalid-refresh-token"));

        when(jwtTokenProvider.validateToken("invalid-refresh-token")).thenReturn(false);

        LoginResponse response = userApplicationService.reissue(request);

        assertThat(response).isNull();
        verify(userService, never()).findUserByEmail(any());
    }

    @Test
    @DisplayName("reissue returns null when cookies are missing")
    void reissue_returnsNullWhenCookiesMissing() {
        MockHttpServletRequest request = new MockHttpServletRequest();

        LoginResponse response = userApplicationService.reissue(request);

        assertThat(response).isNull();
        verify(userService, never()).findUserByEmail(any());
        verify(jwtTokenProvider, never()).validateToken(any());
    }

    @Test
    @DisplayName("reissue returns null when refresh token cookie is absent")
    void reissue_returnsNullWhenRefreshTokenCookieMissing() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie("other", "value"));

        LoginResponse response = userApplicationService.reissue(request);

        assertThat(response).isNull();
        verify(userService, never()).findUserByEmail(any());
        verify(jwtTokenProvider, never()).validateToken(any());
    }

    @Test
    @DisplayName("logout expires refresh token cookie")
    void logout_expiresRefreshTokenCookie() {
        MockHttpServletResponse response = new MockHttpServletResponse();

        userApplicationService.logout(response);

        Cookie refreshCookie = response.getCookie("refreshToken");
        assertThat(refreshCookie).isNotNull();
        assertThat(refreshCookie.getValue()).isEmpty();
        assertThat(refreshCookie.getMaxAge()).isZero();
        assertThat(refreshCookie.isHttpOnly()).isTrue();
    }

    @Test
    @DisplayName("refresh returns newly generated access token")
    void refresh_returnsNewAccessToken() {
        when(jwtTokenProvider.generateAccessToken("user@example.com")).thenReturn("new-access-token");

        String token = userApplicationService.refresh("user@example.com");

        assertThat(token).isEqualTo("new-access-token");
        verify(jwtTokenProvider).generateAccessToken("user@example.com");
    }

    @Test
    @DisplayName("reissue propagates exception when user no longer exists")
    void reissue_propagatesExceptionWhenUserMissing() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie("refreshToken", "valid-refresh-token"));

        when(jwtTokenProvider.validateToken("valid-refresh-token")).thenReturn(true);
        when(jwtTokenProvider.getUserEmail("valid-refresh-token")).thenReturn("ghost@example.com");
        when(userService.findUserByEmail("ghost@example.com"))
                .thenThrow(new IllegalArgumentException("user not found"));

        assertThatThrownBy(() -> userApplicationService.reissue(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("user not found");
    }
}
