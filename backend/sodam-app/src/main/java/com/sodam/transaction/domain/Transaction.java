package com.sodam.transaction.domain;

import com.sodam.transaction.dto.TransactionRequest;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

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

    @Column(name = "transaction_date", nullable = false, length = 14)
    private String transactionDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransactionType type;

    @Column(name = "satisfaction_rating")
    private Integer satisfactionRating;

    @Column(name = "created_at", updatable = false, nullable = false, length = 14)
    private String createdAt;

    @Column(name = "updated_at", nullable = false, length = 14)
    private String updatedAt;

    @Builder
    public Transaction(Long accountBookSeq, Long userSeq, Long categorySeq,
                       BigDecimal amount, String description, String transactionDate,
                       TransactionType type, Integer satisfactionRating) {
        if (amount == null || transactionDate == null || type == null)
            throw new IllegalArgumentException("필수 거래 정보가 누락되었습니다.");
        if (amount.compareTo(BigDecimal.ZERO) <= 0)
            throw new IllegalArgumentException("거래 금액은 0보다 커야 합니다.");
        if (satisfactionRating != null && (satisfactionRating < 1 || satisfactionRating > 5))
            throw new IllegalArgumentException("만족도 평가는 1에서 5 사이여야 합니다.");
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
        if (request.getAmount() != null && request.getAmount().compareTo(BigDecimal.ZERO) <= 0)
            throw new IllegalArgumentException("거래 금액은 0보다 커야 합니다.");
        if (request.getSatisfactionRating() != null && (request.getSatisfactionRating() < 1 || request.getSatisfactionRating() > 5))
            throw new IllegalArgumentException("만족도 평가는 1에서 5 사이여야 합니다.");
        if (request.getTransactionDate() == null) throw new IllegalArgumentException("거래 발생일은 필수입니다.");
        if (request.getType() == null) throw new IllegalArgumentException("거래 유형은 필수입니다.");
        this.amount = request.getAmount() != null ? request.getAmount() : this.amount;
        this.description = request.getDescription();
        this.transactionDate = request.getTransactionDate();
        this.type = request.getType();
        this.satisfactionRating = request.getSatisfactionRating();
        this.categorySeq = request.getCategorySeq();
    }

    @PrePersist
    public void prePersist() {
        String now = now(); this.createdAt = now; this.updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() { this.updatedAt = now(); }

    private String now() {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
    }
}
