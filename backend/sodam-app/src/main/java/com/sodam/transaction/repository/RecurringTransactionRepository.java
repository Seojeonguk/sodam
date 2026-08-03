package com.sodam.transaction.repository;

import com.sodam.transaction.domain.RecurringTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecurringTransactionRepository extends JpaRepository<RecurringTransaction, Long> {
    List<RecurringTransaction> findByAccountBookSeq(Long accountBookSeq);
    List<RecurringTransaction> findByIsActiveTrue();
}
