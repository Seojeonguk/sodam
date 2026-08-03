package com.sodam.transaction.repository;

import com.sodam.transaction.domain.Transaction;
import com.sodam.transaction.dto.TransactionSearchRequest;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class TransactionSpecification {

    public static Specification<Transaction> searchByConditions(TransactionSearchRequest req) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            Optional.ofNullable(req.getAccountBookSeq())
                    .ifPresent(v -> predicates.add(cb.equal(root.get("accountBookSeq"), v)));
            Optional.ofNullable(req.getStartDate())
                    .ifPresent(v -> predicates.add(cb.greaterThanOrEqualTo(root.get("transactionDate"), normalizeStart(v))));
            Optional.ofNullable(req.getEndDate())
                    .ifPresent(v -> predicates.add(cb.lessThanOrEqualTo(root.get("transactionDate"), normalizeEnd(v))));
            Optional.ofNullable(req.getUserId())
                    .ifPresent(v -> predicates.add(cb.equal(root.get("userSeq"), v)));
            List<Long> catSeqs = req.getCategorySeqs();
            if (catSeqs != null && !catSeqs.isEmpty())
                predicates.add(root.get("categorySeq").in(catSeqs));
            if (StringUtils.hasText(req.getKeyword())) {
                String p = "%" + req.getKeyword().trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("description")), p));
            }
            Optional.ofNullable(req.getMinAmount())
                    .ifPresent(v -> predicates.add(cb.greaterThanOrEqualTo(root.get("amount"), v)));
            Optional.ofNullable(req.getMaxAmount())
                    .ifPresent(v -> predicates.add(cb.lessThanOrEqualTo(root.get("amount"), v)));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static String normalizeStart(String d) {
        return d.length() == 8 ? d + "000000" : d.length() == 12 ? d + "00" : d;
    }

    private static String normalizeEnd(String d) {
        return d.length() == 8 ? d + "235959" : d.length() == 12 ? d + "59" : d;
    }
}
