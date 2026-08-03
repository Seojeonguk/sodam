package com.sodam.transaction.service;

import com.sodam.transaction.domain.Transaction;
import com.sodam.transaction.dto.*;
import com.sodam.transaction.repository.StatMapper;
import com.sodam.user.service.UserDomainService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionApplicationService {

    private final TransactionDomainService transactionDomainService;
    private final UserDomainService userDomainService;
    private final StatMapper statMapper;

    @Transactional
    public Transaction createTransaction(TransactionRequest request, String email) {
        request.setUserSeq(userDomainService.findUserByEmail(email).getId());
        return transactionDomainService.createTransaction(request);
    }

    @Transactional(readOnly = true)
    public Transaction getTransactionById(Long seq) {
        return transactionDomainService.getTransactionById(seq);
    }

    @Transactional
    public Transaction updateTransaction(Long seq, TransactionRequest request) {
        return transactionDomainService.updateTransaction(seq, request);
    }

    @Transactional
    public void deleteTransaction(Long seq) {
        transactionDomainService.deleteTransaction(seq);
    }

    @Transactional(readOnly = true)
    public TransactionListResponse getTransactions(TransactionSearchRequest req, Pageable pageable, String email) {
        req.setUserId(userDomainService.findUserByEmail(email).getId());
        Page<Transaction> page = transactionDomainService.getTransactionsByConditions(req, pageable);
        // 카테고리명은 category 서비스 없이 "Unknown"으로 처리 (동일 JVM 내이므로 CategoryService 직접 주입 가능)
        return TransactionListResponse.builder()
                .transactions(page.getContent().stream()
                        .map(t -> TransactionListItemResponse.from(t, "미분류"))
                        .toList())
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }

    @Transactional
    public Integer moveCategory(Long oldCategoryId, Long newCategoryId) {
        return transactionDomainService.moveCategory(oldCategoryId, newCategoryId);
    }

    @Transactional(readOnly = true)
    public List<StatResponse> getStat(StatRequest request, String email) {
        request.setUserSeq(userDomainService.findUserByEmail(email).getId());
        return statMapper.getStat(request);
    }

    @Transactional(readOnly = true)
    public List<StatPeriodResponse> getPeriodStat(StatPeriodRequest request, String email) {
        request.setUserSeq(userDomainService.findUserByEmail(email).getId());
        return statMapper.getPeriodStat(request);
    }
}
