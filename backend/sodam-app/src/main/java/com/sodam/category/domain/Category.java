package com.sodam.category.domain;

import jakarta.persistence.*;
import lombok.*;
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

    @Column(name = "type", nullable = false, length = 10)
    private String type;

    @Column(name = "created_at", updatable = false, nullable = false, length = 14)
    private String createdAt;

    @Column(name = "updated_at", nullable = false, length = 14)
    private String updatedAt;

    public void updateCategory(String name, String description, String color, String type) {
        this.name = name;
        this.description = description;
        this.color = color;
        if (type != null) this.type = type;
        this.updatedAt = now();
    }

    @PrePersist
    public void prePersist() { String n = now(); this.createdAt = n; this.updatedAt = n; }

    @PreUpdate
    public void preUpdate() { this.updatedAt = now(); }

    private String now() {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
    }
}
