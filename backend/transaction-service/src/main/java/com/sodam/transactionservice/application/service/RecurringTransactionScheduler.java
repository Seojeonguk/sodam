package com.sodam.transactionservice.application.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class RecurringTransactionScheduler {

    private final RecurringTransactionApplicationService recurringService;

    /**
     * 매일 자정(00:00)에 실행
     * - 오늘 day_of_month와 일치하는 활성 반복 거래를 실제 거래로 자동 생성
     */
    @Scheduled(cron = "0 0 0 * * *")
    public void executeRecurringTransactions() {
        log.info("반복 거래 스케줄러 시작");
        recurringService.executeScheduled();
    }
}
