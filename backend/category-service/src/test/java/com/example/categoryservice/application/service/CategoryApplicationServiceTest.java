package com.example.categoryservice.application.service;

import com.example.categoryservice.application.api.dto.CategoryCreateRequest;
import com.example.categoryservice.application.api.dto.CategoryDeleteRequest;
import com.example.categoryservice.application.api.dto.CategoryListRequest;
import com.example.categoryservice.application.api.dto.CategoryListResponse;
import com.example.categoryservice.application.api.dto.CategoryUpdateRequest;
import com.example.categoryservice.application.api.dto.CategoryResponse;
import com.example.categoryservice.domain.model.Category;
import com.example.categoryservice.domain.service.CategoryService;
import com.example.categoryservice.infrastructure.TransactionServiceClient;
import com.example.categoryservice.infrastructure.UserDto;
import com.example.categoryservice.infrastructure.UserServiceClient;
import com.sodam.common.exception.CustomException;
import com.sodam.common.response.ApiResponse;
import feign.FeignException;
import feign.Request;
import feign.RequestTemplate;
import java.util.List;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoryApplicationServiceTest {

    @Mock
    private CategoryService categoryService;

    @Mock
    private UserServiceClient userServiceClient;

    @Mock
    private TransactionServiceClient transactionServiceClient;

    @InjectMocks
    private CategoryApplicationService categoryApplicationService;

    @Test
    @DisplayName("createCategory resolves user id from email and returns response")
    void createCategory_setsUserSeqAndReturnsResponse() {
        CategoryCreateRequest request = new CategoryCreateRequest();
        request.setName("food");
        request.setDescription("meals");
        request.setColor("#ffffff");

        UserDto userDto = new UserDto();
        userDto.setId(3L);

        Category createdCategory = Category.builder()
                .name("food")
                .description("meals")
                .color("#ffffff")
                .userSeq(3L)
                .build();

        when(userServiceClient.getUser("user@example.com")).thenReturn(ApiResponse.success(userDto));
        when(categoryService.createCategory(any(CategoryCreateRequest.class))).thenReturn(createdCategory);

        CategoryResponse response = categoryApplicationService.createCategory(request, "user@example.com");

        ArgumentCaptor<CategoryCreateRequest> requestCaptor = ArgumentCaptor.forClass(CategoryCreateRequest.class);
        verify(categoryService).createCategory(requestCaptor.capture());
        assertThat(requestCaptor.getValue().getUserSeq()).isEqualTo(3L);
        assertThat(response.getName()).isEqualTo("food");
    }

    @Test
    @DisplayName("getCategories resolves user id and maps page response")
    void getCategories_setsUserSeqAndMapsResponse() {
        CategoryListRequest request = new CategoryListRequest();
        request.setPage(0);
        request.setLimit(20);

        UserDto userDto = new UserDto();
        userDto.setId(7L);

        Category category = Category.builder()
                .name("food")
                .description("meals")
                .color("#ffffff")
                .userSeq(7L)
                .build();

        when(userServiceClient.getUser("user@example.com")).thenReturn(ApiResponse.success(userDto));
        when(categoryService.getCategoriesByConditions(any(CategoryListRequest.class), eq(PageRequest.of(0, 20))))
                .thenReturn(new PageImpl<>(List.of(category), PageRequest.of(0, 20), 1));

        CategoryListResponse response =
                categoryApplicationService.getCategories(request, PageRequest.of(0, 20), "user@example.com");

        assertThat(request.getUserSeq()).isEqualTo(7L);
        assertThat(response.getCategories()).hasSize(1);
        assertThat(response.getCategories().get(0).getName()).isEqualTo("food");
    }

    @Test
    @DisplayName("deleteCategory moves transactions before deleting category")
    void deleteCategory_movesTransactionsBeforeDelete() {
        UserDto userDto = new UserDto();
        userDto.setId(5L);

        CategoryDeleteRequest request = new CategoryDeleteRequest();
        request.setReplaceCategoryId(99L);

        when(userServiceClient.getUser("user@example.com")).thenReturn(ApiResponse.success(userDto));
        when(transactionServiceClient.moveCategory(11L, 99L)).thenReturn(ApiResponse.success(3L));

        categoryApplicationService.deleteCategory(11L, "user@example.com", request);

        verify(transactionServiceClient).moveCategory(11L, 99L);
        verify(categoryService).deleteCategory(11L, 5L);
    }

    @Test
    @DisplayName("updateCategory resolves user id from email")
    void updateCategory_resolvesUserId() {
        UserDto userDto = new UserDto();
        userDto.setId(8L);

        CategoryUpdateRequest request = new CategoryUpdateRequest();
        request.setName("transport");

        Category updatedCategory = Category.builder()
                .name("transport")
                .description("bus")
                .color("#000000")
                .userSeq(8L)
                .build();

        when(userServiceClient.getUser("user@example.com")).thenReturn(ApiResponse.success(userDto));
        when(categoryService.updateCategory(eq(3L), any(CategoryUpdateRequest.class), eq(8L)))
                .thenReturn(updatedCategory);

        CategoryResponse response = categoryApplicationService.updateCategory(3L, request, "user@example.com");

        assertThat(response.getName()).isEqualTo("transport");
        verify(categoryService).updateCategory(3L, request, 8L);
    }

    @Test
    @DisplayName("getCategory resolves user id and returns mapped response")
    void getCategory_resolvesUserId() {
        UserDto userDto = new UserDto();
        userDto.setId(9L);

        Category category = Category.builder()
                .name("shopping")
                .description("mall")
                .color("#123456")
                .userSeq(9L)
                .build();

        when(userServiceClient.getUser("user@example.com")).thenReturn(ApiResponse.success(userDto));
        when(categoryService.getCategoryById(4L, 9L)).thenReturn(category);

        CategoryResponse response = categoryApplicationService.getCategory(4L, "user@example.com");

        assertThat(response.getName()).isEqualTo("shopping");
        verify(categoryService).getCategoryById(4L, 9L);
    }

    @Test
    @DisplayName("createCategory throws when user response has no data")
    void createCategory_throwsWhenUserResponseHasNoData() {
        CategoryCreateRequest request = new CategoryCreateRequest();
        request.setName("food");

        when(userServiceClient.getUser("user@example.com")).thenReturn(ApiResponse.success(null));

        assertThatThrownBy(() -> categoryApplicationService.createCategory(request, "user@example.com"))
                .isInstanceOf(CustomException.class)
                .hasMessageContaining("user-service");

        verify(categoryService, never()).createCategory(any());
    }

    @Test
    @DisplayName("deleteCategory does not delete category when move transaction call fails")
    void deleteCategory_doesNotDeleteWhenMoveCategoryFails() {
        UserDto userDto = new UserDto();
        userDto.setId(5L);

        CategoryDeleteRequest request = new CategoryDeleteRequest();
        request.setReplaceCategoryId(99L);

        when(userServiceClient.getUser("user@example.com")).thenReturn(ApiResponse.success(userDto));
        when(transactionServiceClient.moveCategory(11L, 99L))
                .thenThrow(FeignException.errorStatus(
                        "TransactionServiceClient#moveCategory",
                        feign.Response.builder()
                                .status(503)
                                .reason("unavailable")
                                .request(Request.create(
                                        Request.HttpMethod.PUT,
                                        "http://localhost/api/transactions/category/move",
                                        java.util.Map.of(),
                                        null,
                                        StandardCharsets.UTF_8,
                                        new RequestTemplate()
                                ))
                                .build()
                ));

        assertThatThrownBy(() -> categoryApplicationService.deleteCategory(11L, "user@example.com", request))
                .isInstanceOf(FeignException.class);

        verify(categoryService, never()).deleteCategory(any(), any());
    }

    @Test
    @DisplayName("deleteCategory does not delete category when move category response is invalid")
    void deleteCategory_doesNotDeleteWhenMoveCategoryResponseInvalid() {
        UserDto userDto = new UserDto();
        userDto.setId(5L);

        CategoryDeleteRequest request = new CategoryDeleteRequest();
        request.setReplaceCategoryId(99L);

        when(userServiceClient.getUser("user@example.com")).thenReturn(ApiResponse.success(userDto));
        when(transactionServiceClient.moveCategory(11L, 99L)).thenReturn(ApiResponse.success(null));

        assertThatThrownBy(() -> categoryApplicationService.deleteCategory(11L, "user@example.com", request))
                .isInstanceOf(CustomException.class)
                .hasMessageContaining("transaction-service");

        verify(categoryService, never()).deleteCategory(any(), any());
    }
}
