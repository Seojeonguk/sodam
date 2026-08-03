package com.sodam.transaction.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Entity
@Table(name = "recurring_transaction")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RecurringTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_book_seq", nullable = false)
    private Long accountBookSeq;

    @Column(name = "user_seq", nullable = false)
    private Long userSeq;

    @Column(name = "category_seq")
    private Long categorySeq;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(length = 255)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransactionType type;

    @Column(name = "day_of_month", nullable = false)
    private Integer dayOfMonth;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, length = 14)
    private String createdAt;

    @Column(name = "updated_at", nullable = false, length = 14)
    private String updatedAt;

    @Builder
    public RecurringTransaction(Long accountBookSeq, Long userSeq, Long categorySeq,
                                BigDecimal amount, String description,
                                TransactionType type, Integer dayOfMonth) {
        this.accountBookSeq = accountBookSeq;
        this.userSeq = userSeq;
        this.categorySeq = categorySeq;
        this.amount = amount;
        this.description = description;
        this.type = type;
        this.dayOfMonth = dayOfMonth;
        this.isActive = true;
        String now = now(); this.createdAt = now; this.updatedAt = now;
    }

    public void update(Long categorySeq, BigDecimal amount, String description,
                       TransactionType type, Integer dayOfMonth) {
        this.categorySeq = categorySeq;
        this.amount = amount;
        this.description = description;
        this.type = type;
        this.dayOfMonth = dayOfMonth;
        this.updatedAt = now();
    }

    public void toggleActive() { this.isActive = !this.isActive; this.updatedAt = now(); }

    @PrePersist
    public void prePersist() { String now = now(); this.createdAt = now; this.updatedAt = now; }

    @PreUpdate
    public void preUpdate() { this.updatedAt = now(); }

    private String now() {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
    }
}
