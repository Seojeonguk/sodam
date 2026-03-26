package com.sodam.transactionservice.domain.service;

import com.sodam.transactionservice.application.api.dto.TransactionMoveCategoryResponse;
import com.sodam.transactionservice.application.api.dto.TransactionRequest;
import com.sodam.transactionservice.application.api.dto.TransactionSearchRequest;
import com.sodam.transactionservice.domain.model.Transaction;
import com.sodam.transactionservice.domain.repository.TransactionRepository;
import com.sodam.transactionservice.domain.repository.TransactionSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class TransactionDomainService {

    private final TransactionRepository transactionRepository;

    /**
     * 새로운 거래를 생성하고 저장합니다.
     * 이 메서드는 순수하게 도메인 객체 (Transaction)를 생성하고 저장하는 역할만 합니다.
     * 외부 서비스(사용자, 가계부, 카테고리 유효성 검증)와의 통신은 Application Service에서 담당합니다.
     *
     * @param request 거래 생성 요청 DTO
     * @return 생성된 거래 엔티티
     */
    @Transactional
    public Transaction createTransaction(TransactionRequest request) {
        Transaction newTransaction = Transaction.builder()
                .accountBookSeq(request.getAccountBookSeq())
                .userSeq(request.getUserSeq())
                .categorySeq(request.getCategorySeq())
                .amount(request.getAmount())
                .description(request.getDescription())
                .transactionDate(request.getTransactionDate())
                .type(request.getType())
                .satisfactionRating(request.getSatisfactionRating())
                .build();

        return transactionRepository.save(newTransaction);
    }

    /**
     * 특정 거래를 ID로 조회합니다.
     *
     * @param transactionSeq 거래 PK
     * @return 조회된 거래 엔티티
     * @throws NoSuchElementException 거래를 찾을 수 없을 경우
     */
    @Transactional(readOnly = true)
    public Transaction getTransactionById(Long transactionSeq) {
        return transactionRepository.findById(transactionSeq)
                .orElseThrow(() -> new NoSuchElementException("거래를 찾을 수 없습니다: " + transactionSeq));
    }

    /**
     * 거래 정보를 업데이트합니다.
     * 엔티티의 비즈니스 행위(updateTransaction)를 호출하여 데이터 변경을 수행합니다.
     *
     * @param transactionSeq 업데이트할 거래의 PK
     * @param request        거래 수정 요청 DTO
     * @return 업데이트된 거래 엔티티
     */
    @Transactional
    public Transaction updateTransaction(Long transactionSeq, TransactionRequest request) {
        Transaction transaction = getTransactionById(transactionSeq);
        transaction.updateTransaction(request);
        return transactionRepository.save(transaction);
    }

    /**
     * 특정 거래를 삭제합니다.
     *
     * @param transactionSeq 삭제할 거래의 PK
     */
    @Transactional
    public void deleteTransaction(Long transactionSeq) {
        if (!transactionRepository.existsById(transactionSeq)) {
            throw new NoSuchElementException("삭제할 거래를 찾을 수 없습니다: " + transactionSeq);
        }
        transactionRepository.deleteById(transactionSeq);
    }

    /**
     * 특정 가계부의 모든 거래를 조회합니다. (새로 추가)
     *
     * @param accountBookSeq 가계부 PK
     * @return 가계부의 모든 거래 목록
     */
    @Transactional(readOnly = true)
    public List<Transaction> findTransactionsByAccountBookSeq(Long accountBookSeq) {
        return transactionRepository.findByAccountBookSeqOrderByTransactionDateDesc(accountBookSeq);
    }

    /**
     * 특정 가계부의 특정 기간 내 거래를 페이지네이션하여 조회합니다. (새로 추가)
     *
     * @param accountBookSeq 가계부 PK
     * @param startDate      조회 시작일
     * @param endDate        조회 종료일
     * @param pageable       페이지네이션 정보
     * @return 페이지네이션된 거래 목록
     */
    @Transactional(readOnly = true)
    public Page<Transaction> findTransactionsByAccountBookSeqAndDateRange(
            Long accountBookSeq, LocalDate startDate, LocalDate endDate, Pageable pageable) {
        return transactionRepository.findByAccountBookSeqAndTransactionDateBetweenOrderByTransactionDateDesc(
                accountBookSeq, startDate, endDate, pageable);
    }

    /**
     * 특정 가계부의 거래 목록을 조건에 따라 페이지네이션하여 조회합니다.
     * startDate와 endDate는 선택적입니다.
     *
     * @param searchRequest 가계부 PK
     * @return 조건에 맞는 페이지네이션된 거래 목록 (Page<Transaction> 객체)
     */
    @Transactional(readOnly = true)
    public Page<Transaction> getTransactionsByConditions(TransactionSearchRequest searchRequest, Pageable pageable) {

        Pageable sortPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, "transactionDate")
        );
        // Specification을 사용하여 동적으로 쿼리 조건 생성
        return transactionRepository.findAll(
                TransactionSpecification.searchByConditions(searchRequest),
                sortPageable
        );
    }

    public Integer moveCategory(Long oldCategoryId, Long newCategoryId) {
        return transactionRepository.updateCategoryForTransactions(oldCategoryId, newCategoryId);
    }
}
