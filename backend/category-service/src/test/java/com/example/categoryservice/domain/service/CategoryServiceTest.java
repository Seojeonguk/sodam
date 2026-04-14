package com.example.categoryservice.domain.service;

import com.example.categoryservice.application.api.dto.CategoryUpdateRequest;
import com.example.categoryservice.domain.model.Category;
import com.example.categoryservice.domain.repository.CategoryRepository;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryService categoryService;

    @Test
    @DisplayName("updateCategory throws when requester is not owner")
    void updateCategory_throwsWhenRequesterIsNotOwner() {
        Category category = Category.builder()
                .name("food")
                .description("meal")
                .color("#ffffff")
                .userSeq(1L)
                .build();

        CategoryUpdateRequest request = new CategoryUpdateRequest();
        request.setName("traffic");

        when(categoryRepository.findById(3L)).thenReturn(Optional.of(category));

        assertThatThrownBy(() -> categoryService.updateCategory(3L, request, 2L))
                .isInstanceOf(IllegalArgumentException.class);

        verify(categoryRepository, never()).save(category);
    }

    @Test
    @DisplayName("getCategoryById with user check throws when requester is not owner")
    void getCategoryByIdWithUserCheck_throwsWhenRequesterIsNotOwner() {
        Category category = Category.builder()
                .name("food")
                .description("meal")
                .color("#ffffff")
                .userSeq(1L)
                .build();

        when(categoryRepository.findById(3L)).thenReturn(Optional.of(category));

        assertThatThrownBy(() -> categoryService.getCategoryById(3L, 9L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("deleteCategory throws when requester is not owner")
    void deleteCategory_throwsWhenRequesterIsNotOwner() {
        Category category = Category.builder()
                .name("food")
                .description("meal")
                .color("#ffffff")
                .userSeq(1L)
                .build();

        when(categoryRepository.findById(3L)).thenReturn(Optional.of(category));

        assertThatThrownBy(() -> categoryService.deleteCategory(3L, 2L))
                .isInstanceOf(IllegalArgumentException.class);

        verify(categoryRepository, never()).deleteById(3L);
    }
}
