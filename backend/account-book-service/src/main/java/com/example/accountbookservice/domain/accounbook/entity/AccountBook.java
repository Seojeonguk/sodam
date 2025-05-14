package com.example.accountbookservice.domain.accounbook.entity;

import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDateTime;

@Entity
@Table(name = "account_book")
@Getter
public class AccountBook {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long seq;

    private String name;

    @Enumerated(EnumType.STRING)
    private AccountBookType type;  // PERSONAL or SHARED

    private Long ownerUserSeq;

    private LocalDateTime createdAt;
    private Long createdUserSeq;
    private LocalDateTime updatedAt;
    private Long updatedUserSeq;

    // 생성자, getter, 정적 팩토리
    protected AccountBook() {}

    public static AccountBook create(String name, AccountBookType type, Long ownerUserSeq, Long userSeq) {
        LocalDateTime now = LocalDateTime.now();
        AccountBook book = new AccountBook();
        book.name = name;
        book.type = type;
        book.ownerUserSeq = ownerUserSeq;
        book.createdAt = now;
        book.createdUserSeq = userSeq;
        book.updatedAt = now;
        book.updatedUserSeq = userSeq;
        return book;
    }
}
