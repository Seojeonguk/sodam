package com.sodam.transactionservice.domain.service;

import com.sodam.transactionservice.application.api.dto.StatPeriodRequest;
import com.sodam.transactionservice.application.api.dto.StatPeriodResponse;
import com.sodam.transactionservice.application.api.dto.StatRequest;
import com.sodam.transactionservice.application.api.dto.StatResponse;
import com.sodam.transactionservice.domain.repository.StatMapper;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StatDomainServiceTest {

    @Mock
    private StatMapper statMapper;

    @InjectMocks
    private StatDomainService statDomainService;

    @Test
    @DisplayName("getStat delegates to mapper")
    void getStat_delegatesToMapper() {
        StatRequest request = new StatRequest();
        request.setUserSeq(1L);

        StatResponse response = new StatResponse();
        response.setType("EXPENSE");
        response.setTotal(15000.0);

        when(statMapper.getStat(request)).thenReturn(List.of(response));

        List<StatResponse> result = statDomainService.getStat(request);

        verify(statMapper).getStat(request);
        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("getPeriodStat delegates to mapper")
    void getPeriodStat_delegatesToMapper() {
        StatPeriodRequest request = new StatPeriodRequest();
        request.setUserSeq(2L);

        StatPeriodResponse response = new StatPeriodResponse();
        response.setType("INCOME");
        response.setTransaction_date("20260414");
        response.setTotal(22000.0);

        when(statMapper.getPeriodStat(request)).thenReturn(List.of(response));

        List<StatPeriodResponse> result = statDomainService.getPeriodStat(request);

        verify(statMapper).getPeriodStat(request);
        assertThat(result).extracting(StatPeriodResponse::getType).containsExactly("INCOME");
    }
}
