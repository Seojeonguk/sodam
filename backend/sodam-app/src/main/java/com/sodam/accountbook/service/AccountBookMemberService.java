package com.sodam.accountbook.service;

import com.sodam.accountbook.domain.AccountBookMember;
import com.sodam.accountbook.domain.Authority;
import com.sodam.accountbook.repository.AccountBookMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AccountBookMemberService {

    private final AccountBookMemberRepository accountBookMemberRepository;

    @Transactional
    public AccountBookMember createAccountBookMember(AccountBookMember member) {
        return accountBookMemberRepository.save(member);
    }

    @Transactional(readOnly = true)
    public List<AccountBookMember> findByAccountBookId(Long accountBookId) {
        return accountBookMemberRepository.findByAccountBookId(accountBookId);
    }

    @Transactional(readOnly = true)
    public boolean isMember(Long accountBookId, Long userId) {
        return accountBookMemberRepository.existsByAccountBookIdAndUserId(accountBookId, userId);
    }

    @Transactional(readOnly = true)
    public boolean isOwner(Long accountBookId, Long userId) {
        return accountBookMemberRepository.findByAccountBookIdAndUserId(accountBookId, userId)
                .map(m -> m.getAuthority() == Authority.OWNER)
                .orElse(false);
    }

    @Transactional
    public AccountBookMember updateAuthority(Long accountBookId, Long userId, Authority newAuthority) {
        AccountBookMember member = accountBookMemberRepository.findByAccountBookIdAndUserId(accountBookId, userId)
                .orElseThrow(() -> new IllegalArgumentException("해당 멤버를 찾을 수 없습니다."));
        member.updateAuthority(newAuthority);
        return accountBookMemberRepository.save(member);
    }

    @Transactional
    public void removeMember(Long accountBookId, Long userId) {
        accountBookMemberRepository.deleteByAccountBookIdAndUserId(accountBookId, userId);
    }
}
