package com.sodam.accountbookservice.domain.service;

import com.sodam.accountbookservice.application.api.dto.AccountBookCreateRequest;
import com.sodam.accountbookservice.application.api.dto.AccountBookUpdateRequest;
import com.sodam.accountbookservice.domain.model.AccountBook;
import com.sodam.accountbookservice.domain.repository.AccountBookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        if(accountBook == null) {
            throw new IllegalArgumentException("존재하지 않는 가계부입니다: " + id);
        }

        accountBook.updateAccountBook(request);

        return accountBookRepository.save(accountBook);
    }

    @Transactional(readOnly = true)
    public AccountBook getAccountBookById(Long id) {
        return accountBookRepository.findById(id).orElse(null);
    }

    @Transactional
    public void deleteAccountBookById(Long id) {
        AccountBook accountBook = getAccountBookById(id);
        if(accountBook == null) {
            throw new IllegalArgumentException("존재하지 않는 가계부입니다: " + id);
        }

        accountBookRepository.delete(accountBook);
    }
}
