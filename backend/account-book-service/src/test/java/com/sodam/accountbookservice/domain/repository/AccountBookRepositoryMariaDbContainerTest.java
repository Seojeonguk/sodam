package com.sodam.accountbookservice.domain.repository;

import com.sodam.accountbookservice.application.api.dto.AccountBookListResponse;
import com.sodam.accountbookservice.domain.model.AccountBook;
import com.sodam.accountbookservice.domain.model.AccountBookMember;
import com.sodam.accountbookservice.domain.model.Authority;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MariaDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = {
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers(disabledWithoutDocker = true)
class AccountBookRepositoryMariaDbContainerTest {

    @Container
    static final MariaDBContainer<?> mariaDb =
            new MariaDBContainer<>("mariadb:11.4")
                    .withDatabaseName("sodam_account_book_test")
                    .withUsername("sodam")
                    .withPassword("sodam");

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", mariaDb::getJdbcUrl);
        registry.add("spring.datasource.username", mariaDb::getUsername);
        registry.add("spring.datasource.password", mariaDb::getPassword);
        registry.add("spring.datasource.driver-class-name", mariaDb::getDriverClassName);
    }

    @Autowired
    private AccountBookRepository accountBookRepository;

    @Autowired
    private AccountBookMemberRepository accountBookMemberRepository;

    @Test
    @DisplayName("mariadb native query returns owner and active shared account books")
    void mariadb_nativeQueryReturnsAccessibleAccountBooks() {
        AccountBook ownerBook = accountBookRepository.save(
                AccountBook.builder().name("owner-book").createdBy(1L).updatedBy(1L).build()
        );
        AccountBook editorBook = accountBookRepository.save(
                AccountBook.builder().name("editor-book").createdBy(2L).updatedBy(2L).build()
        );
        AccountBook expiredBook = accountBookRepository.save(
                AccountBook.builder().name("expired-book").createdBy(3L).updatedBy(3L).build()
        );

        accountBookMemberRepository.save(AccountBookMember.builder()
                .accountBookId(ownerBook.getId())
                .userId(10L)
                .authority(Authority.OWNER)
                .isAvailable("Y")
                .createdBy(10L)
                .updatedBy(10L)
                .build());

        accountBookMemberRepository.save(AccountBookMember.builder()
                .accountBookId(editorBook.getId())
                .userId(10L)
                .authority(Authority.EDITOR)
                .isAvailable("Y")
                .availableFrom("20200101000000")
                .availableTo("20991231235959")
                .createdBy(10L)
                .updatedBy(10L)
                .build());

        accountBookMemberRepository.save(AccountBookMember.builder()
                .accountBookId(expiredBook.getId())
                .userId(10L)
                .authority(Authority.VIEWER)
                .isAvailable("Y")
                .availableFrom("20200101000000")
                .availableTo("20200101235959")
                .createdBy(10L)
                .updatedBy(10L)
                .build());

        List<AccountBookListResponse> result = accountBookRepository.findAccessibleAccountBooks(10L);

        assertThat(result).extracting(AccountBookListResponse::getName)
                .contains("owner-book", "editor-book")
                .doesNotContain("expired-book");
    }

    @Test
    @DisplayName("mariadb sets audit fields for account book member")
    void mariadb_setsAuditFieldsForAccountBookMember() {
        AccountBook accountBook = accountBookRepository.save(
                AccountBook.builder().name("main").createdBy(1L).updatedBy(1L).build()
        );

        AccountBookMember saved = accountBookMemberRepository.save(AccountBookMember.builder()
                .accountBookId(accountBook.getId())
                .userId(20L)
                .authority(Authority.OWNER)
                .isAvailable("Y")
                .createdBy(20L)
                .updatedBy(20L)
                .build());

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCreatedAt()).hasSize(14);
        assertThat(saved.getUpdatedAt()).hasSize(14);
    }
}
