package com.sodam.userservice.application.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sodam.userservice.application.api.dto.LoginRequest;
import com.sodam.userservice.application.api.dto.LoginResponse;
import com.sodam.userservice.application.api.dto.RegisterRequest;
import com.sodam.userservice.application.service.UserApplicationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private UserApplicationService userApplicationService;

    @InjectMocks
    private AuthController authController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("login endpoint returns success response")
    void login_returnsSuccessResponse() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(authController).build();

        LoginRequest request = new LoginRequest();
        request.setEmail("user@example.com");
        request.setPassword("password");

        when(userApplicationService.login(any(LoginRequest.class), any()))
                .thenReturn(LoginResponse.builder().accessToken("access-token").build());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("S-00000"))
                .andExpect(jsonPath("$.data.accessToken").value("access-token"));
    }

    @Test
    @DisplayName("logout endpoint delegates cookie expiration to service")
    void logout_delegatesCookieExpiration() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(authController).build();

        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("S-00000"));

        verify(userApplicationService).logout(any());
    }

    @Test
    @DisplayName("reissue endpoint returns unauthorized code when refresh token is invalid")
    void reissue_returnsUnauthorizedWhenServiceReturnsNull() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(authController).build();

        when(userApplicationService.reissue(any())).thenReturn(null);

        mockMvc.perform(post("/api/auth/reissue"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("E-00002"));
    }

    @Test
    @DisplayName("register endpoint returns created response")
    void register_returnsCreatedResponse() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(authController).build();

        RegisterRequest request = new RegisterRequest();
        request.setEmail("new@example.com");
        request.setPassword("password");
        request.setName("tester");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value("S-00000"));

        verify(userApplicationService).registerNewUser(any(RegisterRequest.class));
    }

    @Test
    @DisplayName("refresh endpoint returns newly generated token")
    void refresh_returnsSuccessResponse() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(authController).build();

        when(userApplicationService.refresh("user@example.com")).thenReturn("new-access-token");

        mockMvc.perform(get("/api/auth/refresh")
                        .param("userId", "user@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("S-00000"))
                .andExpect(jsonPath("$.data").value("new-access-token"));
    }
}
