package com.sodam.transaction.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class RecurringTransactionScheduler {

    private final RecurringTransactionApplicationService recurringService;

    @Scheduled(cron = "0 0 0 * * *")
    public void executeRecurringTransactions() {
        log.info("반복 거래 스케줄러 시작");
        recurringService.executeScheduled();
    }
}
