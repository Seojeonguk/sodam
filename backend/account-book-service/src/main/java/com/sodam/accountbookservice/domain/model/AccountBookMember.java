package com.sodam.accountbookservice.domain.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Entity
@Table(name = "account_book_member")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@Builder
@AllArgsConstructor
public class AccountBookMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long accountBookId;

    private Long userId;

    @Enumerated(EnumType.STRING)
    private Authority authority;

    private String isAvailable;

    @Column(name = "available_from", length = 14)
    private String availableFrom;

    @Column(name = "available_to", length = 14)
    private String availableTo;

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false, length = 14)
    private String createdAt;

    @Column(name = "created_by")
    private Long createdBy;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false, length = 14)
    private String updatedAt;

    @Column(name = "updated_by")
    private Long updatedBy;

    public void updateAuthority(Authority newAuthority) {
        this.authority = newAuthority;
    }

    @PrePersist
    public void prePersist() {
        String now = now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = now();
    }

    private String now() {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
    }
}
