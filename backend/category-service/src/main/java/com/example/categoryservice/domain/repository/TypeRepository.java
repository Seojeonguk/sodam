package com.example.categoryservice.domain.repository;

import com.example.categoryservice.domain.model.Classification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface TypeRepository extends JpaRepository<Classification, Long>, JpaSpecificationExecutor<Classification> {
    List<Classification> findAllByAccountBookSeqOrderByIdAsc(Long accountBookSeq);
}
