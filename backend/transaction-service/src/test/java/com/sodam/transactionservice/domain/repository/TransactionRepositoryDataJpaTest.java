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

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = {
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.url=jdbc:h2:mem:txdb;MODE=MySQL;DB_CLOSE_DELAY=-1;NON_KEYWORDS=TRANSACTION"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class TransactionRepositoryDataJpaTest {

    @Autowired
    private TransactionRepository transactionRepository;

    @Test
    @DisplayName("transaction specification filters by account book, user, and normalized date range")
    void transactionSpecification_filtersByConditions() {
        transactionRepository.saveAll(List.of(
                Transaction.builder()
                        .accountBookSeq(1L)
                        .userSeq(10L)
                        .categorySeq(101L)
                        .amount(BigDecimal.valueOf(12000))
                        .description("breakfast")
                        .transactionDate("20260414083000")
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
                        .accountBookSeq(2L)
                        .userSeq(11L)
                        .categorySeq(103L)
                        .amount(BigDecimal.valueOf(9000))
                        .description("other")
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

        assertThat(result).hasSize(2);
        assertThat(result).extracting(Transaction::getDescription)
                .containsExactlyInAnyOrder("breakfast", "salary");
    }

    @Test
    @DisplayName("saving transaction sets createdAt and updatedAt")
    void save_setsAuditFields() {
        Transaction saved = transactionRepository.save(
                Transaction.builder()
                        .accountBookSeq(1L)
                        .userSeq(1L)
                        .categorySeq(1L)
                        .amount(BigDecimal.valueOf(1000))
                        .description("coffee")
                        .transactionDate("20260414120000")
                        .type(TransactionType.EXPENSE)
                        .build()
        );

        assertThat(saved.getSeq()).isNotNull();
        assertThat(saved.getCreatedAt()).hasSize(14);
        assertThat(saved.getUpdatedAt()).hasSize(14);
    }
}
