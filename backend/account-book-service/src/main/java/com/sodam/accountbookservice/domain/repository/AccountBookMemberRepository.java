package com.sodam.accountbookservice.domain.repository;

import com.sodam.accountbookservice.domain.model.AccountBookMember;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountBookMemberRepository extends JpaRepository<AccountBookMember, Long> {
}
