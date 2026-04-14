package com.sodam.accountbookservice.domain.repository;

import com.sodam.accountbookservice.application.api.dto.AccountBookListResponse;
import com.sodam.accountbookservice.domain.model.AccountBook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AccountBookRepository extends JpaRepository<AccountBook, Long> {

    @Query(value = """
        SELECT
            ab.id,
            ab.name,
            CASE WHEN abm.authority = 'OWNER' THEN 1 ELSE 0 END,
            CASE WHEN abm.authority = 'VIEWER' THEN 0 ELSE 1 END
        FROM account_book_member abm
        JOIN account_book ab ON abm.account_book_id = ab.id
        WHERE abm.user_id = :userId
          AND (
            DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')
                BETWEEN abm.available_from AND abm.available_to
            AND abm.authority != 'OWNER'
            OR abm.authority = 'OWNER'
          )
        ORDER BY abm.created_at DESC
    """, nativeQuery = true)
    List<AccountBookListResponse> findAccessibleAccountBooks(@Param("userId") Long userId);
}
