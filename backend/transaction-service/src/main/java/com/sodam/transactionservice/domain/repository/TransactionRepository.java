package com.sodam.transactionservice.domain.repository;

import com.sodam.transactionservice.domain.model.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long>, JpaSpecificationExecutor<Transaction> {

    // 특정 가계부의 모든 거래 조회
    List<Transaction> findByAccountBookSeqOrderByTransactionDateDesc(Long accountBookSeq);

    // 특정 가계부의 특정 기간 거래 조회
    Page<Transaction> findByAccountBookSeqAndTransactionDateBetweenOrderByTransactionDateDesc(
            Long accountBookSeq, LocalDate startDate, LocalDate endDate, Pageable pageable);

    @Modifying
    @Query("UPDATE Transaction t SET t.categorySeq = :newCategorySeq WHERE t.categorySeq = :oldCategorySeq")
    int updateCategoryForTransactions(@Param("oldCategorySeq") Long oldCategorySeq,
                                      @Param("newCategorySeq") Long newCategorySeq);
}
