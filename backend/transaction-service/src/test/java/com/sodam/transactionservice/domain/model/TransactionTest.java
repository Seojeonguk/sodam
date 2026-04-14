package com.sodam.transactionservice.domain.model;

import com.sodam.transactionservice.application.api.dto.TransactionRequest;
import java.math.BigDecimal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TransactionTest {

    @Test
    @DisplayName("builder rejects zero amount")
    void builder_throwsWhenAmountIsZero() {
        assertThatThrownBy(() -> Transaction.builder()
                .accountBookSeq(1L)
                .userSeq(2L)
                .categorySeq(3L)
                .amount(BigDecimal.ZERO)
                .transactionDate("20260414120000")
                .type(TransactionType.EXPENSE)
                .build())
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("builder rejects invalid satisfaction rating")
    void builder_throwsWhenSatisfactionRatingIsInvalid() {
        assertThatThrownBy(() -> Transaction.builder()
                .accountBookSeq(1L)
                .userSeq(2L)
                .categorySeq(3L)
                .amount(BigDecimal.valueOf(1000))
                .transactionDate("20260414120000")
                .type(TransactionType.EXPENSE)
                .satisfactionRating(6)
                .build())
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("updateTransaction rejects null transaction date")
    void updateTransaction_throwsWhenTransactionDateIsNull() {
        Transaction transaction = Transaction.builder()
                .accountBookSeq(1L)
                .userSeq(2L)
                .categorySeq(3L)
                .amount(BigDecimal.valueOf(1000))
                .transactionDate("20260414120000")
                .type(TransactionType.EXPENSE)
                .build();

        TransactionRequest request = TransactionRequest.builder()
                .amount(BigDecimal.valueOf(2000))
                .transactionDate(null)
                .type(TransactionType.EXPENSE)
                .build();

        assertThatThrownBy(() -> transaction.updateTransaction(request))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("updateTransaction rejects null type")
    void updateTransaction_throwsWhenTypeIsNull() {
        Transaction transaction = Transaction.builder()
                .accountBookSeq(1L)
                .userSeq(2L)
                .categorySeq(3L)
                .amount(BigDecimal.valueOf(1000))
                .transactionDate("20260414120000")
                .type(TransactionType.EXPENSE)
                .build();

        TransactionRequest request = TransactionRequest.builder()
                .amount(BigDecimal.valueOf(2000))
                .transactionDate("20260415120000")
                .type(null)
                .build();

        assertThatThrownBy(() -> transaction.updateTransaction(request))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("updateTransaction applies changed values")
    void updateTransaction_updatesFields() {
        Transaction transaction = Transaction.builder()
                .accountBookSeq(1L)
                .userSeq(2L)
                .categorySeq(3L)
                .amount(BigDecimal.valueOf(1000))
                .description("before")
                .transactionDate("20260414120000")
                .type(TransactionType.EXPENSE)
                .satisfactionRating(2)
                .build();

        TransactionRequest request = TransactionRequest.builder()
                .categorySeq(5L)
                .amount(BigDecimal.valueOf(2500))
                .description("after")
                .transactionDate("20260415120000")
                .type(TransactionType.INCOME)
                .satisfactionRating(5)
                .build();

        transaction.updateTransaction(request);

        assertThat(transaction.getCategorySeq()).isEqualTo(5L);
        assertThat(transaction.getAmount()).isEqualByComparingTo("2500");
        assertThat(transaction.getDescription()).isEqualTo("after");
        assertThat(transaction.getTransactionDate()).isEqualTo("20260415120000");
        assertThat(transaction.getType()).isEqualTo(TransactionType.INCOME);
        assertThat(transaction.getSatisfactionRating()).isEqualTo(5);
    }
}
