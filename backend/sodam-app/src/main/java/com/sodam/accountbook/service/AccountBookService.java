package com.sodam.accountbook.service;

import com.sodam.accountbook.domain.AccountBook;
import com.sodam.accountbook.dto.AccountBookCreateRequest;
import com.sodam.accountbook.dto.AccountBookListResponse;
import com.sodam.accountbook.dto.AccountBookUpdateRequest;
import com.sodam.accountbook.repository.AccountBookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AccountBookService {

    private final AccountBookRepository accountBookRepository;

    @Transactional
    public AccountBook createAccountBook(AccountBookCreateRequest request) {
        AccountBook accountBook = AccountBook.builder()
                .name(request.getName())
                .createdBy(request.getUserId())
                .updatedBy(request.getUserId())
                .build();
        return accountBookRepository.save(accountBook);
    }

    @Transactional
    public AccountBook updateAccountBook(Long id, AccountBookUpdateRequest request) {
        AccountBook accountBook = getAccountBookById(id);
        accountBook.updateAccountBook(request);
        return accountBookRepository.save(accountBook);
    }

    @Transactional(readOnly = true)
    public AccountBook getAccountBookById(Long id) {
        return accountBookRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 가계부입니다: " + id));
    }

    @Transactional
    public void deleteAccountBookById(Long id) {
        AccountBook accountBook = getAccountBookById(id);
        accountBookRepository.delete(accountBook);
    }

    @Transactional(readOnly = true)
    public List<AccountBookListResponse> getAccountBooks(Long userId) {
        return accountBookRepository.findAccessibleAccountBooks(userId);
    }
}
