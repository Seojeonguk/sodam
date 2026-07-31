package com.sodam.transactionservice.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Entity
@Table(name = "budget")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Budget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_book_seq", nullable = false)
    private Long accountBookSeq;

    @Column(name = "user_seq", nullable = false)
    private Long userSeq;

    @Column(name = "category_seq")
    private Long categorySeq;

    /** YYYYMM */
    @Column(name = "year_month", nullable = false, length = 6)
    private String yearMonth;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(name = "created_at", updatable = false, nullable = false, length = 14)
    private String createdAt;

    @Column(name = "updated_at", nullable = false, length = 14)
    private String updatedAt;

    @Builder
    public Budget(Long accountBookSeq, Long userSeq, Long categorySeq,
                  String yearMonth, BigDecimal amount) {
        this.accountBookSeq = accountBookSeq;
        this.userSeq = userSeq;
        this.categorySeq = categorySeq;
        this.yearMonth = yearMonth;
        this.amount = amount;
        String now = now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    public void updateAmount(BigDecimal amount) {
        this.amount = amount;
        this.updatedAt = now();
    }

    private String now() {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
    }
}
