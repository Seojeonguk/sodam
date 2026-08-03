package com.sodam.category.repository;

import com.sodam.category.domain.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long>, JpaSpecificationExecutor<Category> {

    @Query("SELECT c FROM Category c WHERE c.id IN :ids")
    List<Category> findAllByIdIn(@Param("ids") List<Long> ids);
}
