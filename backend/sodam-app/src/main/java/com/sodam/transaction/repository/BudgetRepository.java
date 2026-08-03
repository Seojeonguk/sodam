package com.sodam.transaction.repository;

import com.sodam.transaction.domain.Budget;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BudgetRepository extends JpaRepository<Budget, Long> {
    Optional<Budget> findByAccountBookSeqAndCategorySeqAndSettingDay(Long accountBookSeq, Long categorySeq, String settingDay);
    List<Budget> findByAccountBookSeqAndSettingDay(Long accountBookSeq, String settingDay);
}
