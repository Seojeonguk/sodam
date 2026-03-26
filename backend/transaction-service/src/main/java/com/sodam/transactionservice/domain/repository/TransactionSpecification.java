package com.sodam.transactionservice.domain.repository;

import com.sodam.transactionservice.application.api.dto.TransactionSearchRequest;
import com.sodam.transactionservice.domain.model.Transaction;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class TransactionSpecification {

    public static Specification<Transaction> searchByConditions(TransactionSearchRequest searchRequest) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            Optional.ofNullable(searchRequest.getAccountBookSeq()).ifPresent(accountBookSeq ->
                    predicates.add(criteriaBuilder.equal(root.get("accountBookSeq"), accountBookSeq))
            );

            Optional.ofNullable(searchRequest.getStartDate()).ifPresent(sDate ->
                    predicates.add(criteriaBuilder.greaterThanOrEqualTo(
                            root.get("transactionDate"),
                            normalizeStartDate(sDate)
                    ))
            );

            Optional.ofNullable(searchRequest.getEndDate()).ifPresent(eDate ->
                    predicates.add(criteriaBuilder.lessThanOrEqualTo(
                            root.get("transactionDate"),
                            normalizeEndDate(eDate)
                    ))
            );

            Optional.ofNullable(searchRequest.getUserId()).ifPresent(userSeq ->
                    predicates.add(criteriaBuilder.equal(root.get("userSeq"), userSeq))
            );

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static String normalizeStartDate(String date) {
        if (date.length() == 8) {
            return date + "000000";
        }
        if (date.length() == 12) {
            return date + "00";
        }
        return date;
    }

    private static String normalizeEndDate(String date) {
        if (date.length() == 8) {
            return date + "235959";
        }
        if (date.length() == 12) {
            return date + "59";
        }
        return date;
    }
}
