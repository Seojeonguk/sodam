package com.sodam.transactionservice.domain.service;

import com.sodam.transactionservice.application.api.dto.StatPeriodRequest;
import com.sodam.transactionservice.application.api.dto.StatPeriodResponse;
import com.sodam.transactionservice.application.api.dto.StatRequest;
import com.sodam.transactionservice.application.api.dto.StatResponse;
import com.sodam.transactionservice.domain.repository.StatMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StatDomainService {

    private final StatMapper mapper;

    public List<StatResponse> getStat(StatRequest request) {
        return mapper.getStat(request);
    }

    public List<StatPeriodResponse> getPeriodStat(StatPeriodRequest request) {
        return mapper.getPeriodStat(request);
    }
}
