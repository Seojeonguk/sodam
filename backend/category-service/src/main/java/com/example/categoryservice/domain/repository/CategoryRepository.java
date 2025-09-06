package com.example.categoryservice.domain.repository;

import com.example.categoryservice.domain.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {
}
