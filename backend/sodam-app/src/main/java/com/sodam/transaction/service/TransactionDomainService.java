package com.sodam.transaction.service;

import com.sodam.transaction.domain.Transaction;
import com.sodam.transaction.dto.TransactionRequest;
import com.sodam.transaction.dto.TransactionSearchRequest;
import com.sodam.transaction.repository.TransactionRepository;
import com.sodam.transaction.repository.TransactionSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TransactionDomainService {

    private final TransactionRepository transactionRepository;

    @Transactional
    public Transaction createTransaction(TransactionRequest request) {
        Transaction t = Transaction.builder()
                .accountBookSeq(request.getAccountBookSeq())
                .userSeq(request.getUserSeq())
                .categorySeq(request.getCategorySeq())
                .amount(request.getAmount())
                .description(request.getDescription())
                .transactionDate(request.getTransactionDate())
                .type(request.getType())
                .satisfactionRating(request.getSatisfactionRating())
                .build();
        return transactionRepository.save(t);
    }

    @Transactional(readOnly = true)
    public Transaction getTransactionById(Long seq) {
        return transactionRepository.findById(seq)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 거래입니다: " + seq));
    }

    @Transactional
    public Transaction updateTransaction(Long seq, TransactionRequest request) {
        Transaction t = getTransactionById(seq);
        t.updateTransaction(request);
        return transactionRepository.save(t);
    }

    @Transactional
    public void deleteTransaction(Long seq) {
        transactionRepository.deleteById(seq);
    }

    @Transactional(readOnly = true)
    public Page<Transaction> getTransactionsByConditions(TransactionSearchRequest req, Pageable pageable) {
        return transactionRepository.findAll(TransactionSpecification.searchByConditions(req), pageable);
    }

    @Transactional
    public Integer moveCategory(Long oldCategoryId, Long newCategoryId) {
        return transactionRepository.updateCategoryForTransactions(oldCategoryId, newCategoryId);
    }
}
