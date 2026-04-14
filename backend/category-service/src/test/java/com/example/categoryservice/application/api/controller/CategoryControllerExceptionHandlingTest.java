package com.example.categoryservice.application.api.controller;

import com.example.categoryservice.application.api.dto.CategoryUpdateRequest;
import com.example.categoryservice.application.service.CategoryApplicationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sodam.common.exception.GlobalExceptionHandler;
import com.sodam.common.security.UserContextArgumentResolver;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class CategoryControllerExceptionHandlingTest {

    @Mock
    private CategoryApplicationService categoryApplicationService;

    @InjectMocks
    private CategoryController categoryController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("missing user header returns bad request")
    void missingUserHeader_returnsBadRequest() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        mockMvc.perform(get("/api/categories")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("E-00001"));
    }

    @Test
    @DisplayName("type mismatch path variable returns bad request")
    void pathVariableTypeMismatch_returnsBadRequest() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        mockMvc.perform(get("/api/categories/not-a-number")
                        .header("X-User-Email", "tester@example.com"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("E-00001"));
    }

    @Test
    @DisplayName("illegal argument from service returns bad request")
    void illegalArgument_returnsBadRequest() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        CategoryUpdateRequest request = new CategoryUpdateRequest();
        request.setName("traffic");

        when(categoryApplicationService.updateCategory(eq(3L), any(CategoryUpdateRequest.class), eq("tester@example.com")))
                .thenThrow(new IllegalArgumentException("forbidden"));

        mockMvc.perform(put("/api/categories/3")
                        .header("X-User-Email", "tester@example.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("E-00001"))
                .andExpect(jsonPath("$.message").value("forbidden"));
    }

    private MockMvc buildMockMvc() {
        return MockMvcBuilders.standaloneSetup(categoryController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(
                        new PageableHandlerMethodArgumentResolver(),
                        new UserContextArgumentResolver()
                )
                .build();
    }
}
