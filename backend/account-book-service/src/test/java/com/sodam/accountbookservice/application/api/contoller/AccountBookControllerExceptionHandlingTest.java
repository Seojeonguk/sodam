package com.sodam.accountbookservice.application.api.contoller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sodam.accountbookservice.application.api.dto.AccountBookUpdateRequest;
import com.sodam.accountbookservice.application.service.AccountBookApplicationService;
import com.sodam.common.exception.GlobalExceptionHandler;
import com.sodam.common.security.UserContextArgumentResolver;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AccountBookControllerExceptionHandlingTest {

    @Mock
    private AccountBookApplicationService accountBookApplicationService;

    @InjectMocks
    private AccountBookController accountBookController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("missing user header returns bad request")
    void missingUserHeader_returnsBadRequest() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        mockMvc.perform(get("/api/account-books"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("E-00001"));
    }

    @Test
    @DisplayName("type mismatch path variable returns bad request")
    void pathVariableTypeMismatch_returnsBadRequest() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        mockMvc.perform(get("/api/account-books/not-a-number")
                        .header("X-User-Email", "tester@example.com"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("E-00001"));
    }

    @Test
    @DisplayName("illegal argument from update service returns bad request")
    void illegalArgumentOnUpdate_returnsBadRequest() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        AccountBookUpdateRequest request = new AccountBookUpdateRequest();
        request.setName("renamed");

        when(accountBookApplicationService.updateAccountBook(eq(3L), any(AccountBookUpdateRequest.class), eq("tester@example.com")))
                .thenThrow(new IllegalArgumentException("bad request"));

        mockMvc.perform(put("/api/account-books/3")
                        .header("X-User-Email", "tester@example.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("E-00001"))
                .andExpect(jsonPath("$.message").value("bad request"));
    }

    @Test
    @DisplayName("illegal argument from delete service returns bad request")
    void illegalArgumentOnDelete_returnsBadRequest() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        doThrow(new IllegalArgumentException("missing account book"))
                .when(accountBookApplicationService).deleteAccountBook(3L, "tester@example.com");

        mockMvc.perform(delete("/api/account-books/3")
                        .header("X-User-Email", "tester@example.com"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("E-00001"))
                .andExpect(jsonPath("$.message").value("missing account book"));
    }

    private MockMvc buildMockMvc() {
        return MockMvcBuilders.standaloneSetup(accountBookController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new UserContextArgumentResolver())
                .build();
    }
}
