package com.sodam.transaction.repository;

import com.sodam.transaction.domain.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TransactionRepository extends JpaRepository<Transaction, Long>, JpaSpecificationExecutor<Transaction> {

    @Modifying
    @Query("UPDATE Transaction t SET t.categorySeq = :newCategorySeq WHERE t.categorySeq = :oldCategorySeq")
    int updateCategoryForTransactions(@Param("oldCategorySeq") Long oldCategorySeq,
                                      @Param("newCategorySeq") Long newCategorySeq);
}
