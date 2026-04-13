package com.example.categoryservice.application.api.controller;

import com.example.categoryservice.application.api.dto.ClassificationResponse;
import com.example.categoryservice.application.service.ClassificationInternalService;
import com.sodam.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/classifications")
@RequiredArgsConstructor
public class ClassificationController {

    private final ClassificationInternalService classificationInternalService;

    @GetMapping
    public ApiResponse<List<ClassificationResponse>> getClassifications(
            @RequestParam Long accountBookSeq
    ) {
        return ApiResponse.success(classificationInternalService.getClassifications(accountBookSeq));
    }
}
