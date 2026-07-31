package com.sodam.transactionservice.domain.repository;

import com.sodam.transactionservice.domain.model.Budget;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BudgetRepository extends JpaRepository<Budget, Long> {

    List<Budget> findByAccountBookSeqAndYearMonth(Long accountBookSeq, String yearMonth);

    Optional<Budget> findByAccountBookSeqAndCategorySeqAndYearMonth(
            Long accountBookSeq, Long categorySeq, String yearMonth);

    void deleteByAccountBookSeqAndCategorySeqAndYearMonth(
            Long accountBookSeq, Long categorySeq, String yearMonth);
}
