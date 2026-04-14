package com.sodam.accountbookservice.domain.repository;

import com.sodam.accountbookservice.application.api.dto.AccountBookListResponse;
import com.sodam.accountbookservice.domain.model.AccountBook;
import com.sodam.accountbookservice.domain.model.AccountBookMember;
import com.sodam.accountbookservice.domain.model.Authority;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = {
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.url=jdbc:h2:mem:accountbookdb;MODE=MySQL;DB_CLOSE_DELAY=-1"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class AccountBookRepositoryDataJpaTest {

    @Autowired
    private AccountBookRepository accountBookRepository;

    @Autowired
    private AccountBookMemberRepository accountBookMemberRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUpH2Functions() {
        jdbcTemplate.execute("""
                CREATE ALIAS IF NOT EXISTS DATE_FORMAT AS $$
                String dateFormat(java.sql.Timestamp value, String pattern) {
                    return new java.text.SimpleDateFormat("yyyyMMddHHmmss").format(value);
                }
                $$;
                """);
    }

    @Test
    @DisplayName("findAccessibleAccountBooks returns owner and active member books")
    void findAccessibleAccountBooks_returnsAccessibleBooks() {
        AccountBook ownerBook = accountBookRepository.save(
                AccountBook.builder().name("owner-book").createdBy(1L).updatedBy(1L).build()
        );
        AccountBook viewerBook = accountBookRepository.save(
                AccountBook.builder().name("viewer-book").createdBy(2L).updatedBy(2L).build()
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
                .accountBookId(viewerBook.getId())
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
                .contains("owner-book", "viewer-book")
                .doesNotContain("expired-book");
    }

    @Test
    @DisplayName("saving account book member sets audit fields")
    void saveMember_setsAuditFields() {
        AccountBook accountBook = accountBookRepository.save(
                AccountBook.builder().name("main").createdBy(1L).updatedBy(1L).build()
        );

        AccountBookMember member = accountBookMemberRepository.save(AccountBookMember.builder()
                .accountBookId(accountBook.getId())
                .userId(20L)
                .authority(Authority.OWNER)
                .isAvailable("Y")
                .createdBy(20L)
                .updatedBy(20L)
                .build());

        assertThat(member.getId()).isNotNull();
        assertThat(member.getCreatedAt()).hasSize(14);
        assertThat(member.getUpdatedAt()).hasSize(14);
    }
}
