package com.example.categoryservice.application.api.controller;

import com.example.categoryservice.application.api.dto.CategoryCreateRequest;
import com.example.categoryservice.application.api.dto.CategoryDeleteRequest;
import com.example.categoryservice.application.api.dto.CategoryListResponse;
import com.example.categoryservice.application.api.dto.CategoryResponse;
import com.example.categoryservice.application.api.dto.CategoryUpdateRequest;
import com.example.categoryservice.application.service.CategoryApplicationService;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class CategoryControllerTest {

    @Mock
    private CategoryApplicationService categoryApplicationService;

    @InjectMocks
    private CategoryController categoryController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("createCategory endpoint returns created response")
    void createCategory_returnsCreatedResponse() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        CategoryCreateRequest request = new CategoryCreateRequest();
        request.setName("food");

        when(categoryApplicationService.createCategory(any(CategoryCreateRequest.class), eq("tester@example.com")))
                .thenReturn(CategoryResponse.builder().name("food").build());

        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value("S-00000"))
                .andExpect(jsonPath("$.data.name").value("food"));
    }

    @Test
    @DisplayName("getCategories endpoint returns success response")
    void getCategories_returnsSuccessResponse() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        when(categoryApplicationService.getCategories(any(), any(), eq("tester@example.com")))
                .thenReturn(CategoryListResponse.builder()
                        .categories(List.of())
                        .pageNumber(0)
                        .pageSize(20)
                        .totalElements(0L)
                        .totalPages(0)
                        .build());

        mockMvc.perform(get("/api/categories")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("S-00000"))
                .andExpect(jsonPath("$.data.pageSize").value(20));
    }

    @Test
    @DisplayName("deleteCategory endpoint returns success response")
    void deleteCategory_returnsSuccessResponse() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        CategoryDeleteRequest request = new CategoryDeleteRequest();
        request.setReplaceCategoryId(99L);

        mockMvc.perform(delete("/api/categories/11")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("S-00000"));
    }

    @Test
    @DisplayName("updateCategory endpoint returns success response")
    void updateCategory_returnsSuccessResponse() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        CategoryUpdateRequest request = new CategoryUpdateRequest();
        request.setName("traffic");

        when(categoryApplicationService.updateCategory(eq(3L), any(CategoryUpdateRequest.class), eq("tester@example.com")))
                .thenReturn(CategoryResponse.builder().name("traffic").build());

        mockMvc.perform(put("/api/categories/3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("S-00000"))
                .andExpect(jsonPath("$.data.name").value("traffic"));
    }

    @Test
    @DisplayName("getCategory endpoint returns success response")
    void getCategory_returnsSuccessResponse() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        when(categoryApplicationService.getCategory(7L, "tester@example.com"))
                .thenReturn(CategoryResponse.builder().name("shopping").build());

        mockMvc.perform(get("/api/categories/7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("S-00000"))
                .andExpect(jsonPath("$.data.name").value("shopping"));
    }

    private MockMvc buildMockMvc() {
        return MockMvcBuilders.standaloneSetup(categoryController)
                .setCustomArgumentResolvers(
                        new PageableHandlerMethodArgumentResolver(),
                        new CurrentUserArgumentResolver()
                )
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
