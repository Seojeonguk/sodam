package com.sodam.accountbookservice.domain.service;

import com.sodam.accountbookservice.application.api.dto.AccountBookCreateRequest;
import com.sodam.accountbookservice.domain.model.AccountBook;
import com.sodam.accountbookservice.domain.repository.AccountBookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AccountBookService {

    private final AccountBookRepository accountBookRepository;


    public AccountBook createAccountBook(AccountBookCreateRequest request) {
        AccountBook accountBook = AccountBook.builder()
                .name(request.getName())
                .createdBy(request.getUserId())
                .updatedBy(request.getUserId())
                .build();

        return accountBookRepository.save(accountBook);
    }
}
