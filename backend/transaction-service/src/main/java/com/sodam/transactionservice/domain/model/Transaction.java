package com.sodam.transactionservice.domain.model;

import com.sodam.transactionservice.application.api.dto.TransactionRequest;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "transaction")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@ToString
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long seq;

    @Column(name = "account_book_seq")
    private Long accountBookSeq;

    @Column(name = "user_seq")
    private Long userSeq;

    @Column(name = "category_seq")
    private Long categorySeq;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(length = 255)
    private String description;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransactionType type;

    @Column(name = "satisfaction_rating")
    private Integer satisfactionRating;

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public Transaction(Long accountBookSeq, Long userSeq, Long categorySeq,
                       BigDecimal amount, String description, LocalDate transactionDate,
                       TransactionType type, Integer satisfactionRating) {

        if (amount == null || transactionDate == null || type == null) {
            throw new IllegalArgumentException("필수 거래 정보가 누락되었습니다.");
        }

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("거래 금액은 0보다 커야 합니다.");
        }

        if (satisfactionRating != null && (satisfactionRating < 1 || satisfactionRating > 5)) {
            throw new IllegalArgumentException("만족도 평가는 1에서 5 사이여야 합니다.");
        }

        this.accountBookSeq = accountBookSeq;
        this.userSeq = userSeq;
        this.categorySeq = categorySeq;
        this.amount = amount;
        this.description = description;
        this.transactionDate = transactionDate;
        this.type = type;
        this.satisfactionRating = satisfactionRating;
    }

    public void updateTransaction(TransactionRequest request) {
        if (request.getAmount() != null && request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("거래 금액은 0보다 커야 합니다.");
        }

        if (request.getSatisfactionRating() != null && (request.getSatisfactionRating() < 1 || request.getSatisfactionRating() > 5)) {
            throw new IllegalArgumentException("만족도 평가는 1에서 5 사이여야 합니다.");
        }

        if (request.getTransactionDate() == null) {
            throw new IllegalArgumentException("거래 발생일은 필수입니다.");
        }

        if (request.getType() == null) {
            throw new IllegalArgumentException("거래 유형은 필수입니다.");
        }

        this.amount = (request.getAmount() != null ? request.getAmount() : this.amount);
        this.description = request.getDescription();
        this.transactionDate = request.getTransactionDate();
        this.type = request.getType();
        this.satisfactionRating = request.getSatisfactionRating();
        this.categorySeq = request.getCategorySeq();
    }
}
