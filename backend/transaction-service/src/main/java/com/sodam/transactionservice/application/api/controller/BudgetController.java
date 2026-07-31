package com.sodam.transactionservice.application.api.controller;

import com.sodam.common.response.ApiResponse;
import com.sodam.common.security.CurrentUser;
import com.sodam.common.security.UserContext;
import com.sodam.transactionservice.application.api.dto.BudgetRequest;
import com.sodam.transactionservice.application.api.dto.BudgetResponse;
import com.sodam.transactionservice.application.api.dto.BudgetSummaryResponse;
import com.sodam.transactionservice.application.service.BudgetApplicationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
@Slf4j
public class BudgetController {

    private final BudgetApplicationService budgetApplicationService;

    /** 예산 생성/수정 (upsert) */
    @PostMapping
    public ResponseEntity<ApiResponse<BudgetResponse>> upsertBudget(
            @RequestBody BudgetRequest request,
            @CurrentUser UserContext userContext
    ) {
        log.info("예산 upsert 요청: {}", request);
        BudgetResponse response = budgetApplicationService.upsertBudget(request, userContext.email());
        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(response));
    }

    /** 예산 삭제 */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteBudget(@PathVariable Long id) {
        log.info("예산 삭제 요청: id={}", id);
        budgetApplicationService.deleteBudget(id);
        return ApiResponse.success(null);
    }

    /**
     * 특정 월 예산 → 다른 월로 복사
     * POST /api/budgets/copy?accountBookSeq=1&fromYearMonth=202506&toYearMonth=202507
     */
    @PostMapping("/copy")
    public ApiResponse<Integer> copyBudgets(
            @RequestParam Long accountBookSeq,
            @RequestParam String fromYearMonth,
            @RequestParam String toYearMonth,
            @CurrentUser UserContext userContext
    ) {
        log.info("예산 복사 요청: {} → {}", fromYearMonth, toYearMonth);
        int count = budgetApplicationService.copyBudgets(accountBookSeq, fromYearMonth, toYearMonth, userContext.email());
        return ApiResponse.success(count);
    }

    /**
     * 예산 요약 조회
     * GET /api/budgets/summary?accountBookSeq=1&yearMonth=202507
     */
    @GetMapping("/summary")
    public ApiResponse<List<BudgetSummaryResponse>> getBudgetSummary(
            @RequestParam Long accountBookSeq,
            @RequestParam String yearMonth,
            @CurrentUser UserContext userContext
    ) {
        log.info("예산 요약 조회: accountBookSeq={}, yearMonth={}", accountBookSeq, yearMonth);
        return ApiResponse.success(
                budgetApplicationService.getBudgetSummary(accountBookSeq, yearMonth, userContext.email())
        );
    }
}
