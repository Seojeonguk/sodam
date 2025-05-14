package com.example.accountbookservice.domain.accounbook.repository;

import com.example.accountbookservice.domain.accounbook.entity.AccountBook;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AccountBookRepository extends JpaRepository<AccountBook, Long> {
    List<AccountBook> findByOwnerUserSeq(Long ownerUserSeq);
}

