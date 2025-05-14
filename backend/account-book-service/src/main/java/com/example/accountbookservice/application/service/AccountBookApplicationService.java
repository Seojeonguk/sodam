package com.example.accountbookservice.application.service;

import com.example.accountbookservice.application.dto.AccountBookCreateRequest;
import com.example.accountbookservice.application.dto.AccountBookResponse;
import com.example.accountbookservice.domain.accounbook.entity.AccountBook;
import com.example.accountbookservice.domain.accounbook.repository.AccountBookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AccountBookApplicationService {

    private final AccountBookRepository accountBookRepository;

    public Long createAccountBook(AccountBookCreateRequest request, Long userSeq) {
        AccountBook book = AccountBook.create(request.getName(), request.getType(), userSeq, userSeq);
        return accountBookRepository.save(book).getSeq();
    }

    public List<AccountBookResponse> getMyAccountBooks(Long userSeq) {
        return accountBookRepository.findByOwnerUserSeq(userSeq).stream()
                .map(book -> new AccountBookResponse(book.getSeq(), book.getName(), book.getType()))
                .collect(Collectors.toList());
    }
}
