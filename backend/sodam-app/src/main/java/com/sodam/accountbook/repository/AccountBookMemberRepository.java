package com.sodam.accountbook.repository;

import com.sodam.accountbook.domain.AccountBookMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AccountBookMemberRepository extends JpaRepository<AccountBookMember, Long> {
    List<AccountBookMember> findByAccountBookId(Long accountBookId);
    Optional<AccountBookMember> findByAccountBookIdAndUserId(Long accountBookId, Long userId);
    boolean existsByAccountBookIdAndUserId(Long accountBookId, Long userId);
    void deleteByAccountBookIdAndUserId(Long accountBookId, Long userId);
}
