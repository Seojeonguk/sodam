package com.sodam.transactionservice.application.api.controller;

import com.sodam.common.response.ApiResponse;
import com.sodam.common.security.CurrentUser;
import com.sodam.common.security.UserContext;
import com.sodam.transactionservice.application.api.dto.StatPeriodRequest;
import com.sodam.transactionservice.application.api.dto.StatPeriodResponse;
import com.sodam.transactionservice.application.api.dto.StatRequest;
import com.sodam.transactionservice.application.api.dto.StatResponse;
import com.sodam.transactionservice.application.service.StatApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/stat")
public class StatController {
    private final StatApplicationService service;

    @GetMapping("")
    public ApiResponse<List<StatResponse>> getStat(@ModelAttribute StatRequest request, @CurrentUser UserContext userContext) {
        return ApiResponse.success(service.getStat(request, userContext.email()));
    }

    @GetMapping("/period")
    public ApiResponse<List<StatPeriodResponse>> getPeriodStat(
            @ModelAttribute StatPeriodRequest request,
            @CurrentUser UserContext userContext
    ) {
        return ApiResponse.success(service.getPeriodStat(request, userContext.email()));
    }
}
