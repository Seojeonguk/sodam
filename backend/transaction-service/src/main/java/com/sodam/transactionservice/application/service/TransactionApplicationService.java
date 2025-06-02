package com.sodam.transactionservice.application.service;

import com.sodam.transactionservice.application.api.dto.TransactionRequest;
import com.sodam.transactionservice.application.api.dto.TransactionSearchRequest;
import com.sodam.transactionservice.domain.model.Transaction;
import com.sodam.transactionservice.domain.service.TransactionDomainService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TransactionApplicationService {

    private final TransactionDomainService transactionDomainService;

    /**
     * 새로운 거래를 생성합니다.
     *
     * @param request 거래 생성 요청 DTO
     * @return 생성된 거래 엔티티
     */
    @Transactional
    public Transaction createTransaction(TransactionRequest request) {
        return transactionDomainService.createTransaction(request);
    }

    /**
     * 특정 거래를 ID로 조회합니다.
     *
     * @param transactionSeq 거래 PK
     * @return 조회된 거래 엔티티
     */
    @Transactional(readOnly = true)
    public Transaction getTransactionById(Long transactionSeq) {
        return transactionDomainService.getTransactionById(transactionSeq);
    }

    /**
     * 거래 정보를 업데이트합니다.
     *
     * @param transactionSeq 업데이트할 거래의 PK
     * @param request        거래 수정 요청 DTO
     * @return 업데이트된 거래 엔티티
     */
    @Transactional
    public Transaction updateTransaction(Long transactionSeq, TransactionRequest request) {
        return transactionDomainService.updateTransaction(transactionSeq, request);
    }

    /**
     * 특정 거래를 삭제합니다.
     *
     * @param transactionSeq 삭제할 거래의 PK
     */
    @Transactional
    public void deleteTransaction(Long transactionSeq) {
        transactionDomainService.deleteTransaction(transactionSeq);
    }

    /**
     * 특정 가계부의 거래 목록을 조건에 따라 페이지네이션하여 조회합니다.
     * startDate와 endDate는 선택적입니다.
     *
     * @param searchRequest 조회 조건을 담은 DTO
     * @param pageable      페이지네이션 정보
     * @return 조건에 맞는 페이지네이션된 거래 목록 (Page<Transaction> 객체)
     */
    @Transactional(readOnly = true)
    public Page<Transaction> getTransactions(TransactionSearchRequest searchRequest, Pageable pageable) {

        return transactionDomainService.getTransactionsByConditions(searchRequest, pageable);
    }
}
