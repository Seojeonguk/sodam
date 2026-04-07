package com.sodam.transactionservice.application.api.controller;

import com.sodam.common.response.ApiResponse;
import com.sodam.transactionservice.application.api.dto.StatPeriodRequest;
import com.sodam.transactionservice.application.api.dto.StatPeriodResponse;
import com.sodam.transactionservice.application.api.dto.StatRequest;
import com.sodam.transactionservice.application.api.dto.StatResponse;
import com.sodam.transactionservice.application.service.StatApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/stat")
public class StatController {
    private final StatApplicationService service;

    @GetMapping("")
    public ApiResponse<List<StatResponse>> getStat(@ModelAttribute StatRequest request, @RequestHeader("X-User-Email") String email) {
        return ApiResponse.success(service.getStat(request, email));
    }

    @GetMapping("/period")
    public ApiResponse<List<StatPeriodResponse>> getPeriodStat(@ModelAttribute StatPeriodRequest request, @RequestHeader("X-User-Email") String email) {
        return ApiResponse.success(service.getPeriodStat(request, email));
    }
}
