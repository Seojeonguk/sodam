package com.sodam.transactionservice.domain.repository;

import com.sodam.transactionservice.application.api.dto.StatRequest;
import com.sodam.transactionservice.application.api.dto.StatResponse;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface StatMapper {
    StatResponse getStat(StatRequest statRequest);
}
