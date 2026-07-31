package com.sodam.transactionservice.domain.repository;

import com.sodam.transactionservice.application.api.dto.CategorySpendingResponse;
import com.sodam.transactionservice.application.api.dto.StatPeriodRequest;
import com.sodam.transactionservice.application.api.dto.StatPeriodResponse;
import com.sodam.transactionservice.application.api.dto.StatRequest;
import com.sodam.transactionservice.application.api.dto.StatResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface StatMapper {
    List<StatResponse> getStat(StatRequest statRequest);

    List<StatPeriodResponse> getPeriodStat(StatPeriodRequest request);

    /** 예산 요약용: 계정 기준 특정 월의 카테고리별 실지출/수입 */
    List<CategorySpendingResponse> getCategorySpending(
            @Param("accountBookSeq") Long accountBookSeq,
            @Param("userSeq") Long userSeq,
            @Param("startDate") String startDate,
            @Param("endDate") String endDate
    );
}
