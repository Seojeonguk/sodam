package com.sodam.transaction.service;

import com.sodam.category.repository.CategoryRepository;
import com.sodam.transaction.domain.Budget;
import com.sodam.transaction.dto.*;
import com.sodam.transaction.repository.BudgetRepository;
import com.sodam.transaction.repository.StatMapper;
import com.sodam.user.service.UserDomainService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BudgetApplicationService {

    private final BudgetRepository budgetRepository;
    private final StatMapper statMapper;
    private final UserDomainService userDomainService;
    private final CategoryRepository categoryRepository;

    @Transactional
    public BudgetResponse upsertBudget(BudgetRequest request, String email) {
        Long userSeq = userDomainService.findUserByEmail(email).getId();
        Optional<Budget> existing = budgetRepository.findByAccountBookSeqAndCategorySeqAndSettingDay(
                request.getAccountBookSeq(), request.getCategorySeq(), request.getSettingDay());
        Budget budget;
        if (existing.isPresent()) {
            budget = existing.get();
            budget.updateAmount(request.getAmount());
        } else {
            budget = Budget.builder()
                    .accountBookSeq(request.getAccountBookSeq()).userSeq(userSeq)
                    .categorySeq(request.getCategorySeq()).settingDay(request.getSettingDay())
                    .amount(request.getAmount()).build();
        }
        return BudgetResponse.from(budgetRepository.save(budget));
    }

    @Transactional
    public void deleteBudget(Long budgetId) {
        budgetRepository.deleteById(budgetId);
    }

    @Transactional(readOnly = true)
    public List<BudgetSummaryResponse> getBudgetSummary(Long accountBookSeq, String settingDay, String email) {
        Long userSeq = userDomainService.findUserByEmail(email).getId();
        List<Budget> budgets = budgetRepository.findByAccountBookSeqAndSettingDay(accountBookSeq, settingDay);

        String startDate = settingDay + "01000000";
        String endDate   = settingDay + "31235959";
        List<CategorySpendingResponse> spendings = statMapper.getCategorySpending(accountBookSeq, userSeq, startDate, endDate);

        Map<Long, BigDecimal> spendingMap = spendings.stream()
                .filter(s -> s.getCategorySeq() != null)
                .collect(Collectors.toMap(CategorySpendingResponse::getCategorySeq,
                        CategorySpendingResponse::getTotal, BigDecimal::add));

        Set<Long> processedCategorySeqs = new HashSet<>();
        List<BudgetSummaryResponse> result = new ArrayList<>();

        for (Budget budget : budgets) {
            Long catSeq = budget.getCategorySeq();
            String catName = catSeq != null ? getCategoryName(catSeq) : "미분류";
            BigDecimal actual = catSeq != null ? spendingMap.getOrDefault(catSeq, BigDecimal.ZERO) : BigDecimal.ZERO;
            BigDecimal budgetAmt = budget.getAmount();
            double ratio = budgetAmt.compareTo(BigDecimal.ZERO) > 0
                    ? actual.divide(budgetAmt, 4, RoundingMode.HALF_UP).doubleValue() * 100 : -1;

            result.add(BudgetSummaryResponse.builder()
                    .budgetId(budget.getId()).categorySeq(catSeq).categoryName(catName)
                    .budgetAmount(budgetAmt).actualAmount(actual).ratio(ratio)
                    .over(actual.compareTo(budgetAmt) > 0).hasBudget(true).build());
            if (catSeq != null) processedCategorySeqs.add(catSeq);
        }

        for (Map.Entry<Long, BigDecimal> entry : spendingMap.entrySet()) {
            Long catSeq = entry.getKey();
            if (processedCategorySeqs.contains(catSeq)) continue;
            result.add(BudgetSummaryResponse.builder()
                    .budgetId(null).categorySeq(catSeq).categoryName(getCategoryName(catSeq))
                    .budgetAmount(BigDecimal.ZERO).actualAmount(entry.getValue()).ratio(-1)
                    .over(false).hasBudget(false).build());
        }

        result.sort(Comparator.comparing(BudgetSummaryResponse::isHasBudget).reversed()
                .thenComparing(BudgetSummaryResponse::getCategoryName, Comparator.nullsLast(Comparator.naturalOrder())));
        return result;
    }

    @Transactional
    public int copyBudgets(Long accountBookSeq, String fromSettingDay, String toSettingDay, String email) {
        Long userSeq = userDomainService.findUserByEmail(email).getId();
        List<Budget> sourceBudgets = budgetRepository.findByAccountBookSeqAndSettingDay(accountBookSeq, fromSettingDay);
        if (sourceBudgets.isEmpty()) return 0;
        int count = 0;
        for (Budget source : sourceBudgets) {
            Optional<Budget> existing = budgetRepository.findByAccountBookSeqAndCategorySeqAndSettingDay(
                    accountBookSeq, source.getCategorySeq(), toSettingDay);
            if (existing.isPresent()) {
                existing.get().updateAmount(source.getAmount());
                budgetRepository.save(existing.get());
            } else {
                budgetRepository.save(Budget.builder()
                        .accountBookSeq(accountBookSeq).userSeq(userSeq)
                        .categorySeq(source.getCategorySeq()).settingDay(toSettingDay)
                        .amount(source.getAmount()).build());
            }
            count++;
        }
        return count;
    }

    private String getCategoryName(Long categorySeq) {
        return categoryRepository.findById(categorySeq)
                .map(c -> c.getName()).orElse("미분류");
    }
}
