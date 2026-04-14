package com.sodam.transactionservice.domain.repository;

import com.sodam.transactionservice.application.api.dto.TransactionSearchRequest;
import com.sodam.transactionservice.domain.model.Transaction;
import com.sodam.transactionservice.domain.model.TransactionType;
import java.math.BigDecimal;
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
class TransactionRepositoryMariaDbContainerTest {

    @Container
    static final MariaDBContainer<?> mariaDb =
            new MariaDBContainer<>("mariadb:11.4")
                    .withDatabaseName("sodam_tx_test")
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
    private TransactionRepository transactionRepository;

    @Test
    @DisplayName("mariadb filters transactions by normalized date range")
    void mariadb_filtersTransactionsByNormalizedDateRange() {
        transactionRepository.saveAll(List.of(
                Transaction.builder()
                        .accountBookSeq(1L)
                        .userSeq(10L)
                        .categorySeq(101L)
                        .amount(BigDecimal.valueOf(12000))
                        .description("breakfast")
                        .transactionDate("20260414000000")
                        .type(TransactionType.EXPENSE)
                        .build(),
                Transaction.builder()
                        .accountBookSeq(1L)
                        .userSeq(10L)
                        .categorySeq(102L)
                        .amount(BigDecimal.valueOf(30000))
                        .description("salary")
                        .transactionDate("20260415235959")
                        .type(TransactionType.INCOME)
                        .build(),
                Transaction.builder()
                        .accountBookSeq(1L)
                        .userSeq(10L)
                        .categorySeq(103L)
                        .amount(BigDecimal.valueOf(9000))
                        .description("outside-range")
                        .transactionDate("20260416000000")
                        .type(TransactionType.EXPENSE)
                        .build()
        ));

        TransactionSearchRequest request = TransactionSearchRequest.builder()
                .accountBookSeq(1L)
                .userId(10L)
                .startDate("20260414")
                .endDate("20260415")
                .build();

        List<Transaction> result = transactionRepository.findAll(TransactionSpecification.searchByConditions(request));

        assertThat(result).extracting(Transaction::getDescription)
                .containsExactlyInAnyOrder("breakfast", "salary");
    }

    @Test
    @DisplayName("mariadb bulk category update updates matching rows only")
    void mariadb_bulkCategoryUpdate_updatesMatchingRowsOnly() {
        transactionRepository.saveAll(List.of(
                Transaction.builder()
                        .accountBookSeq(1L)
                        .userSeq(10L)
                        .categorySeq(7L)
                        .amount(BigDecimal.valueOf(12000))
                        .description("one")
                        .transactionDate("20260414000000")
                        .type(TransactionType.EXPENSE)
                        .build(),
                Transaction.builder()
                        .accountBookSeq(1L)
                        .userSeq(10L)
                        .categorySeq(7L)
                        .amount(BigDecimal.valueOf(22000))
                        .description("two")
                        .transactionDate("20260415000000")
                        .type(TransactionType.EXPENSE)
                        .build(),
                Transaction.builder()
                        .accountBookSeq(1L)
                        .userSeq(10L)
                        .categorySeq(8L)
                        .amount(BigDecimal.valueOf(32000))
                        .description("three")
                        .transactionDate("20260416000000")
                        .type(TransactionType.EXPENSE)
                        .build()
        ));

        int updated = transactionRepository.updateCategoryForTransactions(7L, 9L);

        List<Transaction> all = transactionRepository.findAll();

        assertThat(updated).isEqualTo(2);
        assertThat(all.stream().filter(t -> t.getCategorySeq().equals(9L))).hasSize(2);
        assertThat(all.stream().filter(t -> t.getCategorySeq().equals(8L))).hasSize(1);
    }
}
