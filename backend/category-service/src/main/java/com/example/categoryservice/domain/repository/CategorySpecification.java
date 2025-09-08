package com.example.categoryservice.domain.repository;

import com.example.categoryservice.application.api.dto.CategoryListRequest;
import com.example.categoryservice.domain.model.Category;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class CategorySpecification {

    public static Specification<Category> searchByConditions(CategoryListRequest searchRequest) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            Optional.ofNullable(searchRequest.getUserSeq()).ifPresent(userSeq ->
                    predicates.add(criteriaBuilder.equal(root.get("userSeq"), userSeq))
            );

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
