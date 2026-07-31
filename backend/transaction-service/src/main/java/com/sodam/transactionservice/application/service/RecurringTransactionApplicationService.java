package com.sodam.transactionservice.application.service;

import com.sodam.common.integration.ExternalResponseValidator;
import com.sodam.transactionservice.application.api.dto.RecurringTransactionRequest;
import com.sodam.transactionservice.application.api.dto.RecurringTransactionResponse;
import com.sodam.transactionservice.domain.model.RecurringTransaction;
import com.sodam.transactionservice.domain.model.Transaction;
import com.sodam.transactionservice.domain.repository.RecurringTransactionRepository;
import com.sodam.transactionservice.domain.repository.TransactionRepository;
import com.sodam.transactionservice.infrastructure.CategoryListItemResponse;
import com.sodam.transactionservice.infrastructure.CategoryServiceClient;
import com.sodam.transactionservice.infrastructure.UserDto;
import com.sodam.transactionservice.infrastructure.UserServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecurringTransactionApplicationService {

    private final RecurringTransactionRepository recurringRepository;
    private final TransactionRepository transactionRepository;
    private final UserServiceClient userServiceClient;
    private final CategoryServiceClient categoryServiceClient;

    /** 반복 거래 생성 */
    @Transactional
    public RecurringTransactionResponse create(RecurringTransactionRequest request, String email) {
        Long userSeq = resolveUserId(email);
        RecurringTransaction entity = RecurringTransaction.builder()
                .accountBookSeq(request.getAccountBookSeq())
                .userSeq(userSeq)
                .categorySeq(request.getCategorySeq())
                .amount(request.getAmount())
                .description(request.getDescription())
                .type(request.getType())
                .dayOfMonth(request.getDayOfMonth())
                .build();
        RecurringTransaction saved = recurringRepository.save(entity);
        return toResponse(saved);
    }

    /** 반복 거래 수정 */
    @Transactional
    public RecurringTransactionResponse update(Long id, RecurringTransactionRequest request) {
        RecurringTransaction entity = recurringRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("반복 거래를 찾을 수 없습니다. id=" + id));
        entity.update(request.getCategorySeq(), request.getAmount(),
                request.getDescription(), request.getType(), request.getDayOfMonth());
        return toResponse(recurringRepository.save(entity));
    }

    /** 활성/비활성 토글 */
    @Transactional
    public RecurringTransactionResponse toggle(Long id) {
        RecurringTransaction entity = recurringRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("반복 거래를 찾을 수 없습니다. id=" + id));
        entity.toggleActive();
        return toResponse(recurringRepository.save(entity));
    }

    /** 반복 거래 삭제 */
    @Transactional
    public void delete(Long id) {
        recurringRepository.deleteById(id);
    }

    /** 가계부별 목록 조회 */
    @Transactional(readOnly = true)
    public List<RecurringTransactionResponse> getList(Long accountBookSeq) {
        List<RecurringTransaction> list = recurringRepository.findByAccountBookSeq(accountBookSeq);
        return enrichWithCategoryNames(list);
    }

    /**
     * 스케줄러 호출: 오늘 날짜에 해당하는 활성 반복 거래를 실제 거래로 생성
     * - dayOfMonth가 오늘과 일치하거나
     * - dayOfMonth가 해당 월의 말일을 초과하고 오늘이 말일인 경우
     */
    @Transactional
    public void executeScheduled() {
        LocalDate today = LocalDate.now();
        int todayDay = today.getDayOfMonth();
        int lastDayOfMonth = YearMonth.of(today.getYear(), today.getMonth()).lengthOfMonth();
        boolean isLastDay = (todayDay == lastDayOfMonth);

        List<RecurringTransaction> actives = recurringRepository.findByIsActiveTrue();
        int created = 0;

        for (RecurringTransaction r : actives) {
            boolean shouldRun = (r.getDayOfMonth() == todayDay)
                    || (isLastDay && r.getDayOfMonth() > lastDayOfMonth);
            if (!shouldRun) continue;

            String txDate = today.format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "000000";
            Transaction tx = Transaction.builder()
                    .accountBookSeq(r.getAccountBookSeq())
                    .userSeq(r.getUserSeq())
                    .categorySeq(r.getCategorySeq())
                    .amount(r.getAmount())
                    .description(r.getDescription())
                    .transactionDate(txDate)
                    .type(r.getType())
                    .satisfactionRating(null)
                    .build();
            transactionRepository.save(tx);
            created++;
            log.info("반복 거래 자동 생성: recurringId={}, accountBookSeq={}, amount={}", r.getId(), r.getAccountBookSeq(), r.getAmount());
        }
        log.info("반복 거래 스케줄러 완료: 생성된 거래 수={}", created);
    }

    // ── 내부 헬퍼 ────────────────────────────────────────────────────────────

    private List<RecurringTransactionResponse> enrichWithCategoryNames(List<RecurringTransaction> list) {
        List<Long> categoryIds = list.stream()
                .map(RecurringTransaction::getCategorySeq)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        Map<Long, String> categoryNames = java.util.Collections.emptyMap();
        if (!categoryIds.isEmpty()) {
            List<CategoryListItemResponse> categories = categoryServiceClient.getCategoriesByIds(categoryIds);
            if (categories != null) {
                categoryNames = categories.stream()
                        .filter(Objects::nonNull)
                        .filter(c -> c.getId() != null)
                        .collect(Collectors.toMap(CategoryListItemResponse::getId, CategoryListItemResponse::getName));
            }
        }

        Map<Long, String> finalCategoryNames = categoryNames;
        return list.stream()
                .map(r -> RecurringTransactionResponse.from(r,
                        r.getCategorySeq() != null ? finalCategoryNames.getOrDefault(r.getCategorySeq(), "미분류") : "미분류"))
                .collect(Collectors.toList());
    }

    private RecurringTransactionResponse toResponse(RecurringTransaction r) {
        String categoryName = "미분류";
        if (r.getCategorySeq() != null) {
            try {
                List<CategoryListItemResponse> cats = categoryServiceClient.getCategoriesByIds(List.of(r.getCategorySeq()));
                if (cats != null && !cats.isEmpty() && cats.get(0) != null) {
                    categoryName = cats.get(0).getName();
                }
            } catch (Exception e) {
                log.warn("카테고리 조회 실패: {}", e.getMessage());
            }
        }
        return RecurringTransactionResponse.from(r, categoryName);
    }

    private Long resolveUserId(String email) {
        UserDto user = ExternalResponseValidator.requireData(userServiceClient.getUser(email), "user-service");
        return ExternalResponseValidator.requireField(user, UserDto::getId, "user-service", "user id");
    }
}
