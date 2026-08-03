package com.sodam.category.repository;

import com.sodam.category.domain.Category;
import com.sodam.category.dto.CategoryListRequest;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class CategorySpecification {

    public static Specification<Category> searchByConditions(CategoryListRequest req) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            Optional.ofNullable(req.getUserSeq())
                    .ifPresent(v -> predicates.add(cb.equal(root.get("userSeq"), v)));
            Optional.ofNullable(req.getType())
                    .ifPresent(v -> predicates.add(cb.equal(root.get("type"), v)));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
