package com.sodam.transactionservice.application.service;

import com.sodam.common.integration.ExternalResponseValidator;
import com.sodam.transactionservice.application.api.dto.StatPeriodRequest;
import com.sodam.transactionservice.application.api.dto.StatPeriodResponse;
import com.sodam.transactionservice.application.api.dto.StatRequest;
import com.sodam.transactionservice.application.api.dto.StatResponse;
import com.sodam.transactionservice.domain.service.StatDomainService;
import com.sodam.transactionservice.infrastructure.UserDto;
import com.sodam.transactionservice.infrastructure.UserServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class StatApplicationService {

    private final StatDomainService statDomainService;
    private final UserServiceClient userServiceClient;

    public List<StatResponse> getStat(StatRequest request, String email) {
        request.setUserSeq(resolveUserId(email));
        return statDomainService.getStat(request);
    }

    public List<StatPeriodResponse> getPeriodStat(StatPeriodRequest request, String email) {
        request.setUserSeq(resolveUserId(email));
        return statDomainService.getPeriodStat(request);
    }

    private Long resolveUserId(String email) {
        UserDto user = ExternalResponseValidator.requireData(userServiceClient.getUser(email), "user-service");
        return ExternalResponseValidator.requireField(user, UserDto::getId, "user-service", "user id");
    }
}
