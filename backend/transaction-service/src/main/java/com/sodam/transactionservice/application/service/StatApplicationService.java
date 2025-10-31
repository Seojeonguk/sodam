package com.sodam.transactionservice.application.service;

import com.sodam.transactionservice.application.api.dto.StatPeriodRequest;
import com.sodam.transactionservice.application.api.dto.StatPeriodResponse;
import com.sodam.transactionservice.application.api.dto.StatRequest;
import com.sodam.transactionservice.application.api.dto.StatResponse;
import com.sodam.transactionservice.domain.service.StatDomainService;
import com.sodam.transactionservice.infrastructure.ApiResponse;
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
        ApiResponse<UserDto> userResponse = userServiceClient.getUser(email);

        log.info("사용자 응답 정보 : {}", userResponse);

        Long id = userResponse.getData().getId();

        log.info("사용자 id : {}" ,id);

        request.setUserSeq(id);

        return statDomainService.getStat(request);
    }

    public List<StatPeriodResponse> getPeriodStat(StatPeriodRequest request, String email) {
        ApiResponse<UserDto> userResponse = userServiceClient.getUser(email);

        log.info("사용자 응답 정보 : {}", userResponse);

        Long id = userResponse.getData().getId();

        log.info("사용자 id : {}" ,id);

        request.setUserSeq(id);

        return statDomainService.getPeriodStat(request);
    }
}
