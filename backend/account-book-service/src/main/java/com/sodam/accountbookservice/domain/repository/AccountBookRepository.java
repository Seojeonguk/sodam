package com.sodam.accountbookservice.domain.repository;

import com.sodam.accountbookservice.domain.model.AccountBook;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountBookRepository extends JpaRepository<AccountBook, Long> {
}
