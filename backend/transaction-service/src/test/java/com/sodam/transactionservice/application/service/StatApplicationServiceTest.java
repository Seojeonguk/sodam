package com.sodam.transactionservice.application.service;

import com.sodam.common.exception.CustomException;
import com.sodam.common.response.ApiResponse;
import com.sodam.transactionservice.application.api.dto.StatPeriodRequest;
import com.sodam.transactionservice.application.api.dto.StatPeriodResponse;
import com.sodam.transactionservice.application.api.dto.StatRequest;
import com.sodam.transactionservice.application.api.dto.StatResponse;
import com.sodam.transactionservice.domain.service.StatDomainService;
import com.sodam.transactionservice.infrastructure.UserDto;
import com.sodam.transactionservice.infrastructure.UserServiceClient;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StatApplicationServiceTest {

    @Mock
    private StatDomainService statDomainService;

    @Mock
    private UserServiceClient userServiceClient;

    @InjectMocks
    private StatApplicationService statApplicationService;

    @Test
    @DisplayName("getStat resolves user id from email before querying stat")
    void getStat_resolvesUserId() {
        StatRequest request = new StatRequest();
        request.setStartDate("20260401");
        request.setEndDate("20260430");

        UserDto userDto = new UserDto();
        userDto.setId(7L);

        StatResponse statResponse = new StatResponse();
        statResponse.setType("EXPENSE");
        statResponse.setTotal(25000.0);

        when(userServiceClient.getUser("tester@example.com")).thenReturn(ApiResponse.success(userDto));
        when(statDomainService.getStat(any(StatRequest.class))).thenReturn(List.of(statResponse));

        List<StatResponse> result = statApplicationService.getStat(request, "tester@example.com");

        ArgumentCaptor<StatRequest> captor = ArgumentCaptor.forClass(StatRequest.class);
        verify(statDomainService).getStat(captor.capture());
        assertThat(captor.getValue().getUserSeq()).isEqualTo(7L);
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getType()).isEqualTo("EXPENSE");
    }

    @Test
    @DisplayName("getPeriodStat resolves user id from email before querying period stat")
    void getPeriodStat_resolvesUserId() {
        StatPeriodRequest request = new StatPeriodRequest();
        request.setStartDate("20260401");
        request.setEndDate("20260430");

        UserDto userDto = new UserDto();
        userDto.setId(11L);

        StatPeriodResponse response = new StatPeriodResponse();
        response.setType("INCOME");
        response.setTransaction_date("20260414");
        response.setTotal(9000.0);

        when(userServiceClient.getUser("tester@example.com")).thenReturn(ApiResponse.success(userDto));
        when(statDomainService.getPeriodStat(any(StatPeriodRequest.class))).thenReturn(List.of(response));

        List<StatPeriodResponse> result =
                statApplicationService.getPeriodStat(request, "tester@example.com");

        ArgumentCaptor<StatPeriodRequest> captor = ArgumentCaptor.forClass(StatPeriodRequest.class);
        verify(statDomainService).getPeriodStat(captor.capture());
        assertThat(captor.getValue().getUserSeq()).isEqualTo(11L);
        assertThat(result).extracting(StatPeriodResponse::getTransaction_date)
                .containsExactly("20260414");
    }

    @Test
    @DisplayName("getStat throws custom exception when user response data is missing")
    void getStat_throwsWhenUserResponseDataMissing() {
        StatRequest request = new StatRequest();

        when(userServiceClient.getUser("tester@example.com")).thenReturn(ApiResponse.success(null));

        assertThatThrownBy(() -> statApplicationService.getStat(request, "tester@example.com"))
                .isInstanceOf(CustomException.class)
                .hasMessageContaining("user-service");
    }
}
