package com.sodam.accountbookservice.domain.repository;

import com.sodam.accountbookservice.application.api.dto.AccountBookListResponse;
import com.sodam.accountbookservice.domain.model.AccountBook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AccountBookRepository extends JpaRepository<AccountBook, Long> {

    @Query("""
        SELECT new com.sodam.accountbookservice.application.api.dto.AccountBookListResponse(
            ab.id,
            ab.name,
            case
                when abm.authority = 'OWNER' then true
                else false
            end,
            case
                when abm.authority = 'VIEWER' then false
                else true
            end
        )
        FROM AccountBookMember abm
        JOIN AccountBook ab ON abm.accountBookId = ab.id
        WHERE abm.userId = :userId
          AND (
            CURRENT_TIMESTAMP BETWEEN abm.availableFrom AND abm.availableTo AND abm.authority != 'OWNER'
            OR abm.authority = 'OWNER'
          )
        ORDER BY abm.createdAt DESC
    """)
    List<AccountBookListResponse> findAccessibleAccountBooks(@Param("userId") Long userId);
}
