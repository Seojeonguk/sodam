package com.sodam.category.repository;

import com.sodam.category.domain.Classification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClassificationRepository extends JpaRepository<Classification, Long> {
    List<Classification> findByAccountBookSeq(Long accountBookSeq);
}
