package com.sodam.category.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Entity
@Getter
@Table(name = "classification")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Classification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name")
    private String name;

    @Column(name = "account_book_seq")
    private Long accountBookSeq;

    @Column(name = "created_at", updatable = false, nullable = false, length = 14)
    private String createdAt;

    @Column(name = "updated_at", nullable = false, length = 14)
    private String updatedAt;

    @PrePersist
    public void prePersist() { String n = now(); this.createdAt = n; this.updatedAt = n; }

    @PreUpdate
    public void preUpdate() { this.updatedAt = now(); }

    private String now() {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
    }
}
