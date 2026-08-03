package com.sodam.transaction.service;

import com.sodam.transaction.domain.RecurringTransaction;
import com.sodam.transaction.domain.Transaction;
import com.sodam.transaction.dto.RecurringTransactionRequest;
import com.sodam.transaction.dto.RecurringTransactionResponse;
import com.sodam.transaction.repository.RecurringTransactionRepository;
import com.sodam.transaction.repository.TransactionRepository;
import com.sodam.user.service.UserDomainService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecurringTransactionApplicationService {

    private final RecurringTransactionRepository recurringRepository;
    private final TransactionRepository transactionRepository;
    private final UserDomainService userDomainService;

    @Transactional
    public RecurringTransactionResponse create(RecurringTransactionRequest request, String email) {
        Long userSeq = userDomainService.findUserByEmail(email).getId();
        RecurringTransaction entity = RecurringTransaction.builder()
                .accountBookSeq(request.getAccountBookSeq()).userSeq(userSeq)
                .categorySeq(request.getCategorySeq()).amount(request.getAmount())
                .description(request.getDescription()).type(request.getType())
                .dayOfMonth(request.getDayOfMonth()).build();
        return RecurringTransactionResponse.from(recurringRepository.save(entity), "미분류");
    }

    @Transactional
    public RecurringTransactionResponse update(Long id, RecurringTransactionRequest request) {
        RecurringTransaction entity = recurringRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("반복 거래를 찾을 수 없습니다. id=" + id));
        entity.update(request.getCategorySeq(), request.getAmount(),
                request.getDescription(), request.getType(), request.getDayOfMonth());
        return RecurringTransactionResponse.from(recurringRepository.save(entity), "미분류");
    }

    @Transactional
    public RecurringTransactionResponse toggle(Long id) {
        RecurringTransaction entity = recurringRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("반복 거래를 찾을 수 없습니다. id=" + id));
        entity.toggleActive();
        return RecurringTransactionResponse.from(recurringRepository.save(entity), "미분류");
    }

    @Transactional
    public void delete(Long id) { recurringRepository.deleteById(id); }

    @Transactional(readOnly = true)
    public List<RecurringTransactionResponse> getList(Long accountBookSeq) {
        return recurringRepository.findByAccountBookSeq(accountBookSeq).stream()
                .map(r -> RecurringTransactionResponse.from(r, "미분류"))
                .toList();
    }

    /** 매일 자정 스케줄러에서 호출 */
    @Transactional
    public void executeScheduled() {
        LocalDate today = LocalDate.now();
        int todayDay = today.getDayOfMonth();
        int lastDayOfMonth = YearMonth.of(today.getYear(), today.getMonth()).lengthOfMonth();
        boolean isLastDay = (todayDay == lastDayOfMonth);

        List<RecurringTransaction> actives = recurringRepository.findByIsActiveTrue();
        int created = 0;
        for (RecurringTransaction r : actives) {
            boolean shouldRun = (r.getDayOfMonth() == todayDay) || (isLastDay && r.getDayOfMonth() > lastDayOfMonth);
            if (!shouldRun) continue;
            String txDate = today.format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "000000";
            transactionRepository.save(Transaction.builder()
                    .accountBookSeq(r.getAccountBookSeq()).userSeq(r.getUserSeq())
                    .categorySeq(r.getCategorySeq()).amount(r.getAmount())
                    .description(r.getDescription()).transactionDate(txDate)
                    .type(r.getType()).satisfactionRating(null).build());
            created++;
        }
        log.info("반복 거래 스케줄러 완료: 생성된 거래 수={}", created);
    }
}
