package com.example.categoryservice.domain.repository;

import com.example.categoryservice.application.api.dto.CategoryListRequest;
import com.example.categoryservice.domain.model.Category;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = {
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.url=jdbc:h2:mem:categorydb;MODE=MySQL;DB_CLOSE_DELAY=-1"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class CategoryRepositoryDataJpaTest {

    @Autowired
    private CategoryRepository categoryRepository;

    @Test
    @DisplayName("category specification filters by user sequence")
    void categorySpecification_filtersByUserSeq() {
        categoryRepository.saveAll(List.of(
                Category.builder().name("food").description("meal").color("#111111").userSeq(1L).build(),
                Category.builder().name("traffic").description("bus").color("#222222").userSeq(1L).build(),
                Category.builder().name("gift").description("present").color("#333333").userSeq(2L).build()
        ));

        CategoryListRequest request = new CategoryListRequest();
        request.setUserSeq(1L);

        List<Category> result = categoryRepository.findAll(CategorySpecification.searchByConditions(request));

        assertThat(result).hasSize(2);
        assertThat(result).extracting(Category::getName)
                .containsExactlyInAnyOrder("food", "traffic");
    }

    @Test
    @DisplayName("saving category sets createdAt and updatedAt")
    void save_setsAuditFields() {
        Category saved = categoryRepository.save(
                Category.builder()
                        .name("shopping")
                        .description("mall")
                        .color("#abcdef")
                        .userSeq(1L)
                        .build()
        );

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCreatedAt()).hasSize(14);
        assertThat(saved.getUpdatedAt()).hasSize(14);
    }
}
