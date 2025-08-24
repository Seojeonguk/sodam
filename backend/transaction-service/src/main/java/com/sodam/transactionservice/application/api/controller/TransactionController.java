package com.sodam.transactionservice.application.api.controller;

import com.sodam.transactionservice.application.api.dto.TransactionRequest;
import com.sodam.transactionservice.application.api.dto.TransactionResponse;
import com.sodam.transactionservice.application.api.dto.TransactionSearchRequest;
import com.sodam.transactionservice.application.service.TransactionApplicationService;
import com.sodam.transactionservice.domain.model.Transaction;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@Slf4j
public class TransactionController {

    private final TransactionApplicationService transactionApplicationService;

    /**
     * 새로운 거래를 생성합니다.
     * POST /api/transactions
     *
     * @param request 거래 생성 요청 DTO
     * @return 생성된 거래 정보 (응답 DTO)
     */
    @PostMapping
    public ResponseEntity<TransactionResponse> createTransaction(@Valid @RequestBody TransactionRequest request, @RequestHeader("X-User-Email") String email) {
        log.info("거래 생성 요청: {}", request);
        Transaction transaction = transactionApplicationService.createTransaction(request, email);
        return ResponseEntity.status(HttpStatus.CREATED).body(TransactionResponse.from(transaction));
    }

    /**
     * 특정 거래를 ID로 조회합니다.
     * GET /api/transactions/{id}
     *
     * @param id 거래 PK
     * @return 조회된 거래 정보 (응답 DTO)
     */
    @GetMapping("/{id}")
    public ResponseEntity<TransactionResponse> getTransactionById(@PathVariable Long id) {
        log.info("거래 조회 요청 ID: {}", id);
        Transaction transaction = transactionApplicationService.getTransactionById(id);
        return ResponseEntity.ok(TransactionResponse.from(transaction));
    }

    /**
     * 거래 정보를 업데이트합니다.
     * PUT /api/transactions/{id}
     *
     * @param id      업데이트할 거래 PK
     * @param request 업데이트 요청 DTO
     * @return 업데이트된 거래 정보 (응답 DTO)
     */
    @PutMapping("/{id}")
    public ResponseEntity<TransactionResponse> updateTransaction(
            @PathVariable Long id, @Valid @RequestBody TransactionRequest request) {
        log.info("거래 [{}] 업데이트 요청: {}", id, request);
        Transaction updatedTransaction = transactionApplicationService.updateTransaction(id, request);
        return ResponseEntity.ok(TransactionResponse.from(updatedTransaction));
    }

    /**
     * 특정 거래를 삭제합니다.
     * DELETE /api/transactions/{id}
     *
     * @param id 삭제할 거래 PK
     * @return HTTP 204 No Content
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable Long id) {
        log.info("거래 [{}] 삭제 요청", id);
        transactionApplicationService.deleteTransaction(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * 특정 가계부의 거래 목록을 조건에 따라 페이지네이션하여 조회합니다.
     * GET /api/transactions
     * (예: /api/transactions?accountBookSeq=1&startDate=2023-01-01&endDate=2023-01-31&page=0&size=10&sort=transactionDate,desc)
     * accountBookSeq는 필수, startDate와 endDate는 선택적입니다.
     *
     * @param searchRequest 검색 조건 DTO (accountBookSeq, startDate, endDate 등)
     * @param pageable      페이지네이션 및 정렬 정보
     * @return 페이지네이션된 거래 목록 (응답 DTO)
     */
    @GetMapping
    public ResponseEntity<Page<TransactionResponse>> getTransactions(
            @ModelAttribute TransactionSearchRequest searchRequest,
            Pageable pageable,
            @RequestHeader("X-User-Email") String email) {
        log.info("거래 목록 조회 요청: 조건 = {}, 페이징 = {}", searchRequest, pageable);
        log.info("거래 목록 조회 요청 사용자 id : {}", email);

        Page<Transaction> transactionsPage = transactionApplicationService.getTransactions(searchRequest, pageable, email);
        return ResponseEntity.ok(transactionsPage.map(TransactionResponse::from));
    }
}
