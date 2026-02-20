package com.example.categoryservice.domain.model;

import com.example.categoryservice.application.api.dto.CategoryUpdateRequest;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Entity
@Getter
@Table(name = "category")
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name")
    private String name;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "user_seq")
    private Long userSeq;

    @Column(name = "color")
    private String color;

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false, length = 14)
    private String createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false, length = 14)
    private String updatedAt;

    public void updateCategory(CategoryUpdateRequest request) {
        this.name = request.getName();
        this.description = request.getDescription();
        this.color = request.getColor();
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
