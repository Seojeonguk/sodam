package com.sodam.transactionservice.domain.service;

import com.sodam.transactionservice.application.api.dto.StatRequest;
import com.sodam.transactionservice.application.api.dto.StatResponse;
import com.sodam.transactionservice.domain.repository.StatMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StatDomainService {

    private final StatMapper mapper;

    public StatResponse getStat(StatRequest request) {
        return mapper.getStat(request);
    }
}
