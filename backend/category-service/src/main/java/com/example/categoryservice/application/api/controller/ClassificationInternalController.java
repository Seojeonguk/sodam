package com.example.categoryservice.application.api.controller;

import com.example.categoryservice.application.api.dto.ClassificationCreateRequest;
import com.example.categoryservice.application.api.dto.ClassificationResponse;
import com.example.categoryservice.application.service.ClassificationInternalService;
import com.sodam.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/internal/classifications")
@RequiredArgsConstructor
public class ClassificationInternalController {

    private final ClassificationInternalService service;

    @PostMapping
    public ApiResponse<ClassificationResponse> createType(
            @RequestBody ClassificationCreateRequest request
    ) {
        return ApiResponse.success(service.createType(request, null));
    }
}
