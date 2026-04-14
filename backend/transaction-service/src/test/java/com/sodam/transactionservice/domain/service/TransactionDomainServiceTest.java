package com.sodam.transactionservice.domain.service;

import com.sodam.transactionservice.application.api.dto.TransactionRequest;
import com.sodam.transactionservice.application.api.dto.TransactionSearchRequest;
import com.sodam.transactionservice.domain.model.Transaction;
import com.sodam.transactionservice.domain.model.TransactionType;
import com.sodam.transactionservice.domain.repository.TransactionRepository;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.NoSuchElementException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.data.jpa.domain.Specification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransactionDomainServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @InjectMocks
    private TransactionDomainService transactionDomainService;

    @Test
    @DisplayName("createTransaction builds and saves a transaction entity")
    void createTransaction_savesBuiltEntity() {
        TransactionRequest request = TransactionRequest.builder()
                .accountBookSeq(1L)
                .userSeq(2L)
                .categorySeq(3L)
                .amount(BigDecimal.valueOf(12000))
                .description("coffee")
                .transactionDate("20260414123000")
                .type(TransactionType.EXPENSE)
                .satisfactionRating(4)
                .build();

        Transaction saved = Transaction.builder()
                .accountBookSeq(1L)
                .userSeq(2L)
                .categorySeq(3L)
                .amount(BigDecimal.valueOf(12000))
                .description("coffee")
                .transactionDate("20260414123000")
                .type(TransactionType.EXPENSE)
                .satisfactionRating(4)
                .build();

        when(transactionRepository.save(any(Transaction.class))).thenReturn(saved);

        Transaction result = transactionDomainService.createTransaction(request);

        ArgumentCaptor<Transaction> transactionCaptor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository).save(transactionCaptor.capture());
        assertThat(transactionCaptor.getValue().getUserSeq()).isEqualTo(2L);
        assertThat(transactionCaptor.getValue().getAmount()).isEqualByComparingTo("12000");
        assertThat(result.getDescription()).isEqualTo("coffee");
    }

    @Test
    @DisplayName("getTransactionById throws when transaction is missing")
    void getTransactionById_throwsWhenMissing() {
        when(transactionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> transactionDomainService.getTransactionById(99L))
                .isInstanceOf(NoSuchElementException.class);
    }

    @Test
    @DisplayName("updateTransaction applies changed fields and saves")
    void updateTransaction_updatesAndSavesEntity() {
        Transaction existing = Transaction.builder()
                .accountBookSeq(1L)
                .userSeq(2L)
                .categorySeq(3L)
                .amount(BigDecimal.valueOf(1000))
                .description("before")
                .transactionDate("20260414100000")
                .type(TransactionType.EXPENSE)
                .satisfactionRating(2)
                .build();
        ReflectionTestUtils.setField(existing, "seq", 7L);

        TransactionRequest request = TransactionRequest.builder()
                .categorySeq(9L)
                .amount(BigDecimal.valueOf(2500))
                .description("after")
                .transactionDate("20260415100000")
                .type(TransactionType.INCOME)
                .satisfactionRating(5)
                .build();

        when(transactionRepository.findById(7L)).thenReturn(Optional.of(existing));
        when(transactionRepository.save(existing)).thenReturn(existing);

        Transaction result = transactionDomainService.updateTransaction(7L, request);

        assertThat(result.getCategorySeq()).isEqualTo(9L);
        assertThat(result.getAmount()).isEqualByComparingTo("2500");
        assertThat(result.getDescription()).isEqualTo("after");
        assertThat(result.getType()).isEqualTo(TransactionType.INCOME);
    }

    @Test
    @DisplayName("deleteTransaction throws when target does not exist")
    void deleteTransaction_throwsWhenMissing() {
        when(transactionRepository.existsById(42L)).thenReturn(false);

        assertThatThrownBy(() -> transactionDomainService.deleteTransaction(42L))
                .isInstanceOf(NoSuchElementException.class);

        verify(transactionRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("getTransactionsByConditions delegates to repository with sorted pageable")
    void getTransactionsByConditions_delegatesToRepository() {
        TransactionSearchRequest searchRequest = new TransactionSearchRequest();
        PageRequest pageable = PageRequest.of(0, 20);

        when(transactionRepository.findAll(any(Specification.class), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(new PageImpl<>(java.util.List.of(), pageable, 0));

        transactionDomainService.getTransactionsByConditions(searchRequest, pageable);

        verify(transactionRepository).findAll(any(Specification.class), any(org.springframework.data.domain.Pageable.class));
    }

    @Test
    @DisplayName("findTransactionsByAccountBookSeq delegates to repository")
    void findTransactionsByAccountBookSeq_delegatesToRepository() {
        Transaction transaction = Transaction.builder()
                .accountBookSeq(3L)
                .userSeq(2L)
                .categorySeq(1L)
                .amount(BigDecimal.valueOf(9000))
                .transactionDate("20260414120000")
                .type(TransactionType.EXPENSE)
                .build();

        when(transactionRepository.findByAccountBookSeqOrderByTransactionDateDesc(3L))
                .thenReturn(java.util.List.of(transaction));

        java.util.List<Transaction> result = transactionDomainService.findTransactionsByAccountBookSeq(3L);

        verify(transactionRepository).findByAccountBookSeqOrderByTransactionDateDesc(3L);
        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("findTransactionsByAccountBookSeqAndDateRange delegates to repository")
    void findTransactionsByAccountBookSeqAndDateRange_delegatesToRepository() {
        Pageable pageable = PageRequest.of(0, 10);
        when(transactionRepository.findByAccountBookSeqAndTransactionDateBetweenOrderByTransactionDateDesc(
                eq(3L), any(java.time.LocalDate.class), any(java.time.LocalDate.class), eq(pageable)))
                .thenReturn(new PageImpl<>(java.util.List.of(), pageable, 0));

        org.springframework.data.domain.Page<Transaction> result =
                transactionDomainService.findTransactionsByAccountBookSeqAndDateRange(
                        3L,
                        java.time.LocalDate.of(2026, 4, 1),
                        java.time.LocalDate.of(2026, 4, 30),
                        pageable
                );

        assertThat(result.getTotalElements()).isZero();
        verify(transactionRepository)
                .findByAccountBookSeqAndTransactionDateBetweenOrderByTransactionDateDesc(
                        eq(3L), any(java.time.LocalDate.class), any(java.time.LocalDate.class), eq(pageable));
    }

    @Test
    @DisplayName("moveCategory delegates to repository update query")
    void moveCategory_delegatesToRepository() {
        when(transactionRepository.updateCategoryForTransactions(10L, 20L)).thenReturn(6);

        Integer result = transactionDomainService.moveCategory(10L, 20L);

        verify(transactionRepository).updateCategoryForTransactions(10L, 20L);
        assertThat(result).isEqualTo(6);
    }
}
