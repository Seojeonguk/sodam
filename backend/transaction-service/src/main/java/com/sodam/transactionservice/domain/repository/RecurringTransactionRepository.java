package com.sodam.transactionservice.domain.repository;

import com.sodam.transactionservice.domain.model.RecurringTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecurringTransactionRepository extends JpaRepository<RecurringTransaction, Long> {

    List<RecurringTransaction> findByAccountBookSeq(Long accountBookSeq);

    /** 스케줄러용: 활성 상태인 모든 반복 거래 */
    List<RecurringTransaction> findByIsActiveTrue();
}
