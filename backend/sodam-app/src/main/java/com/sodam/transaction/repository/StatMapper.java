package com.sodam.transaction.repository;

import com.sodam.transaction.dto.CategorySpendingResponse;
import com.sodam.transaction.dto.StatPeriodRequest;
import com.sodam.transaction.dto.StatPeriodResponse;
import com.sodam.transaction.dto.StatRequest;
import com.sodam.transaction.dto.StatResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface StatMapper {
    List<StatResponse> getStat(StatRequest request);
    List<StatPeriodResponse> getPeriodStat(StatPeriodRequest request);
    List<CategorySpendingResponse> getCategorySpending(
            @Param("accountBookSeq") Long accountBookSeq,
            @Param("userSeq") Long userSeq,
            @Param("startDate") String startDate,
            @Param("endDate") String endDate);
}
