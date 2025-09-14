package com.sodam.accountbookservice.domain.service;

import com.sodam.accountbookservice.domain.model.AccountBookMember;
import com.sodam.accountbookservice.domain.repository.AccountBookMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AccountBookMemberService {

    private final AccountBookMemberRepository accountBookMemberRepository;

    @Transactional
    public AccountBookMember createAccountBookMember(AccountBookMember accountBookMember) {
        return accountBookMemberRepository.save(accountBookMember);
    }
}
