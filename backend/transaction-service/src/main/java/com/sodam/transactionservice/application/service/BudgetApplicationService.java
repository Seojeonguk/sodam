package com.sodam.transactionservice.application.service;

import com.sodam.common.integration.ExternalResponseValidator;
import com.sodam.transactionservice.application.api.dto.*;
import com.sodam.transactionservice.domain.model.Budget;
import com.sodam.transactionservice.domain.repository.BudgetRepository;
import com.sodam.transactionservice.domain.repository.StatMapper;
import com.sodam.transactionservice.infrastructure.CategoryListItemResponse;
import com.sodam.transactionservice.infrastructure.CategoryServiceClient;
import com.sodam.transactionservice.infrastructure.UserDto;
import com.sodam.transactionservice.infrastructure.UserServiceClient;
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
    private final UserServiceClient userServiceClient;
    private final CategoryServiceClient categoryServiceClient;

    /** 예산 설정 (생성 또는 업데이트) */
    @Transactional
    public BudgetResponse upsertBudget(BudgetRequest request, String email) {
        Long userSeq = resolveUserId(email);

        Optional<Budget> existing = budgetRepository.findByAccountBookSeqAndCategorySeqAndYearMonth(
                request.getAccountBookSeq(), request.getCategorySeq(), request.getYearMonth());

        Budget budget;
        if (existing.isPresent()) {
            budget = existing.get();
            budget.updateAmount(request.getAmount());
        } else {
            budget = Budget.builder()
                    .accountBookSeq(request.getAccountBookSeq())
                    .userSeq(userSeq)
                    .categorySeq(request.getCategorySeq())
                    .yearMonth(request.getYearMonth())
                    .amount(request.getAmount())
                    .build();
        }
        return BudgetResponse.from(budgetRepository.save(budget));
    }

    /** 예산 삭제 */
    @Transactional
    public void deleteBudget(Long budgetId) {
        budgetRepository.deleteById(budgetId);
    }

    /**
     * 예산 요약: 예산 설정된 카테고리 + 해당 월 실지출 합산
     * yearMonth: YYYYMM
     */
    @Transactional(readOnly = true)
    public List<BudgetSummaryResponse> getBudgetSummary(Long accountBookSeq, String yearMonth, String email) {
        Long userSeq = resolveUserId(email);

        // 1. 해당 월 예산 목록
        List<Budget> budgets = budgetRepository.findByAccountBookSeqAndYearMonth(accountBookSeq, yearMonth);

        // 2. 해당 월 카테고리별 실지출 (YYYYMM → YYYYMMDD 범위 변환)
        String startDate = yearMonth + "01" + "000000";
        String endDate   = yearMonth + "31" + "235959";
        List<CategorySpendingResponse> spendings = statMapper.getCategorySpending(accountBookSeq, userSeq, startDate, endDate);

        Map<Long, BigDecimal> spendingMap = spendings.stream()
                .filter(s -> s.getCategorySeq() != null)
                .collect(Collectors.toMap(
                        CategorySpendingResponse::getCategorySeq,
                        CategorySpendingResponse::getTotal,
                        BigDecimal::add
                ));

        // 3. 카테고리 정보 조회
        Set<Long> categoryIds = new HashSet<>();
        budgets.forEach(b -> { if (b.getCategorySeq() != null) categoryIds.add(b.getCategorySeq()); });
        spendingMap.keySet().forEach(categoryIds::add);

        Map<Long, CategoryListItemResponse> categoryMap = new HashMap<>();
        if (!categoryIds.isEmpty()) {
            List<CategoryListItemResponse> categories = categoryServiceClient.getCategoriesByIds(new ArrayList<>(categoryIds));
            if (categories != null) {
                categories.stream()
                        .filter(Objects::nonNull)
                        .filter(c -> c.getId() != null)
                        .forEach(c -> categoryMap.put(c.getId(), c));
            }
        }

        // 4. 예산 설정 항목 먼저 구성
        Set<Long> processedCategorySeqs = new HashSet<>();
        List<BudgetSummaryResponse> result = new ArrayList<>();

        for (Budget budget : budgets) {
            Long catSeq = budget.getCategorySeq();
            CategoryListItemResponse cat = catSeq != null ? categoryMap.get(catSeq) : null;
            BigDecimal actual = catSeq != null ? spendingMap.getOrDefault(catSeq, BigDecimal.ZERO) : BigDecimal.ZERO;
            BigDecimal budgetAmt = budget.getAmount();
            double ratio = budgetAmt.compareTo(BigDecimal.ZERO) > 0
                    ? actual.divide(budgetAmt, 4, RoundingMode.HALF_UP).doubleValue() * 100
                    : -1;

            result.add(BudgetSummaryResponse.builder()
                    .budgetId(budget.getId())
                    .categorySeq(catSeq)
                    .categoryName(cat != null ? cat.getName() : "미분류")
                    .categoryColor(cat != null ? cat.getColor() : null)
                    .categoryType(cat != null ? cat.getType() : "EXPENSE")
                    .budgetAmount(budgetAmt)
                    .actualAmount(actual)
                    .ratio(ratio)
                    .over(actual.compareTo(budgetAmt) > 0)
                    .hasBudget(true)
                    .build());

            if (catSeq != null) processedCategorySeqs.add(catSeq);
        }

        // 5. 예산 미설정이지만 거래 있는 카테고리
        for (Map.Entry<Long, BigDecimal> entry : spendingMap.entrySet()) {
            Long catSeq = entry.getKey();
            if (processedCategorySeqs.contains(catSeq)) continue;
            CategoryListItemResponse cat = categoryMap.get(catSeq);
            result.add(BudgetSummaryResponse.builder()
                    .budgetId(null)
                    .categorySeq(catSeq)
                    .categoryName(cat != null ? cat.getName() : "미분류")
                    .categoryColor(cat != null ? cat.getColor() : null)
                    .categoryType(cat != null ? cat.getType() : "EXPENSE")
                    .budgetAmount(BigDecimal.ZERO)
                    .actualAmount(entry.getValue())
                    .ratio(-1)
                    .over(false)
                    .hasBudget(false)
                    .build());
        }

        // 예산 설정 항목 우선, 그 다음 카테고리명 정렬
        result.sort(Comparator.comparing(BudgetSummaryResponse::isHasBudget).reversed()
                .thenComparing(BudgetSummaryResponse::getCategoryName, Comparator.nullsLast(Comparator.naturalOrder())));

        return result;
    }

    /**
     * 특정 월 예산을 다른 월로 복사
     * - 대상 월에 이미 같은 카테고리 예산이 있으면 덮어쓰기(upsert)
     * @return 복사된 예산 수
     */
    @Transactional
    public int copyBudgets(Long accountBookSeq, String fromYearMonth, String toYearMonth, String email) {
        Long userSeq = resolveUserId(email);

        List<Budget> sourceBudgets = budgetRepository.findByAccountBookSeqAndYearMonth(accountBookSeq, fromYearMonth);
        if (sourceBudgets.isEmpty()) return 0;

        int count = 0;
        for (Budget source : sourceBudgets) {
            Optional<Budget> existing = budgetRepository.findByAccountBookSeqAndCategorySeqAndYearMonth(
                    accountBookSeq, source.getCategorySeq(), toYearMonth);

            if (existing.isPresent()) {
                existing.get().updateAmount(source.getAmount());
                budgetRepository.save(existing.get());
            } else {
                budgetRepository.save(Budget.builder()
                        .accountBookSeq(accountBookSeq)
                        .userSeq(userSeq)
                        .categorySeq(source.getCategorySeq())
                        .yearMonth(toYearMonth)
                        .amount(source.getAmount())
                        .build());
            }
            count++;
        }
        return count;
    }

    private Long resolveUserId(String email) {
        UserDto user = ExternalResponseValidator.requireData(userServiceClient.getUser(email), "user-service");
        return ExternalResponseValidator.requireField(user, UserDto::getId, "user-service", "user id");
    }
}
