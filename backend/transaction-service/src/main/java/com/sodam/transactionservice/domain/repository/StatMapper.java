package com.sodam.transactionservice.domain.repository;

import com.sodam.transactionservice.application.api.dto.StatPeriodRequest;
import com.sodam.transactionservice.application.api.dto.StatPeriodResponse;
import com.sodam.transactionservice.application.api.dto.StatRequest;
import com.sodam.transactionservice.application.api.dto.StatResponse;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface StatMapper {
    List<StatResponse> getStat(StatRequest statRequest);

    List<StatPeriodResponse> getPeriodStat(StatPeriodRequest request);
}
