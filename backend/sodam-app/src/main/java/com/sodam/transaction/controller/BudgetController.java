package com.sodam.transaction.controller;

import com.sodam.common.response.ApiResponse;
import com.sodam.common.security.CurrentUser;
import com.sodam.common.security.UserContext;
import com.sodam.transaction.dto.*;
import com.sodam.transaction.service.BudgetApplicationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
@Slf4j
public class BudgetController {

    private final BudgetApplicationService service;

    @PostMapping
    public ResponseEntity<ApiResponse<BudgetResponse>> upsert(
            @RequestBody BudgetRequest request,
            @CurrentUser UserContext userContext
    ) {
        return ResponseEntity.ok(ApiResponse.success(service.upsertBudget(request, userContext.email())));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        service.deleteBudget(id);
        return ApiResponse.success(null);
    }

    @PostMapping("/copy")
    public ApiResponse<Integer> copy(
            @RequestParam Long accountBookSeq,
            @RequestParam String fromSettingDay,
            @RequestParam String toSettingDay,
            @CurrentUser UserContext userContext
    ) {
        return ApiResponse.success(service.copyBudgets(accountBookSeq, fromSettingDay, toSettingDay, userContext.email()));
    }

    @GetMapping("/summary")
    public ApiResponse<List<BudgetSummaryResponse>> summary(
            @RequestParam Long accountBookSeq,
            @RequestParam String settingDay,
            @CurrentUser UserContext userContext
    ) {
        return ApiResponse.success(service.getBudgetSummary(accountBookSeq, settingDay, userContext.email()));
    }
}
