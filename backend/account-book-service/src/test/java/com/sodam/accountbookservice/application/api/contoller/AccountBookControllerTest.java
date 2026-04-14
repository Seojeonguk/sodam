package com.sodam.accountbookservice.application.api.contoller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sodam.accountbookservice.application.api.dto.AccountBookCreateRequest;
import com.sodam.accountbookservice.application.api.dto.AccountBookListResponse;
import com.sodam.accountbookservice.application.api.dto.AccountBookResponse;
import com.sodam.accountbookservice.application.api.dto.AccountBookUpdateRequest;
import com.sodam.accountbookservice.application.service.AccountBookApplicationService;
import com.sodam.common.security.CurrentUser;
import com.sodam.common.security.UserContext;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AccountBookControllerTest {

    @Mock
    private AccountBookApplicationService accountBookApplicationService;

    @InjectMocks
    private AccountBookController accountBookController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("getAccountBooks endpoint returns success response")
    void getAccountBooks_returnsSuccessResponse() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        when(accountBookApplicationService.getAccountBooks("tester@example.com"))
                .thenReturn(List.of(new AccountBookListResponse(1L, "main", 1, 1)));

        mockMvc.perform(get("/api/account-books"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("S-00000"))
                .andExpect(jsonPath("$.data[0].name").value("main"));
    }

    @Test
    @DisplayName("createAccountBook endpoint returns success response")
    void createAccountBook_returnsSuccessResponse() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        AccountBookCreateRequest request = new AccountBookCreateRequest();
        request.setName("main");

        when(accountBookApplicationService.createAccountBook(any(AccountBookCreateRequest.class), eq("tester@example.com")))
                .thenReturn(AccountBookResponse.builder().id(3L).name("main").updatedAt("20260414140000").build());

        mockMvc.perform(post("/api/account-books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("S-00000"))
                .andExpect(jsonPath("$.data.id").value(3L));
    }

    @Test
    @DisplayName("updateAccountBook endpoint returns success response")
    void updateAccountBook_returnsSuccessResponse() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        AccountBookUpdateRequest request = new AccountBookUpdateRequest();
        request.setName("renamed");

        when(accountBookApplicationService.updateAccountBook(eq(3L), any(AccountBookUpdateRequest.class), eq("tester@example.com")))
                .thenReturn(AccountBookResponse.builder().id(3L).name("renamed").updatedAt("20260414143000").build());

        mockMvc.perform(put("/api/account-books/3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("S-00000"))
                .andExpect(jsonPath("$.data.name").value("renamed"));
    }

    @Test
    @DisplayName("getAccountBook endpoint returns success response")
    void getAccountBook_returnsSuccessResponse() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        when(accountBookApplicationService.getAccountBook(3L, "tester@example.com"))
                .thenReturn(AccountBookResponse.builder().id(3L).name("main").updatedAt("20260414143000").build());

        mockMvc.perform(get("/api/account-books/3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("S-00000"))
                .andExpect(jsonPath("$.data.id").value(3L));
    }

    @Test
    @DisplayName("deleteAccountBook endpoint returns success response")
    void deleteAccountBook_returnsSuccessResponse() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        mockMvc.perform(delete("/api/account-books/3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("S-00000"));

        verify(accountBookApplicationService).deleteAccountBook(3L, "tester@example.com");
    }

    private MockMvc buildMockMvc() {
        return MockMvcBuilders.standaloneSetup(accountBookController)
                .setCustomArgumentResolvers(new CurrentUserArgumentResolver())
                .build();
    }

    private static class CurrentUserArgumentResolver implements HandlerMethodArgumentResolver {
        @Override
        public boolean supportsParameter(MethodParameter parameter) {
            return parameter.hasParameterAnnotation(CurrentUser.class)
                    && parameter.getParameterType().equals(UserContext.class);
        }

        @Override
        public Object resolveArgument(
                MethodParameter parameter,
                ModelAndViewContainer mavContainer,
                NativeWebRequest webRequest,
                WebDataBinderFactory binderFactory
        ) {
            return UserContext.of("tester@example.com");
        }
    }
}
