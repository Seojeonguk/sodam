package com.sodam.category.controller;

import com.sodam.category.dto.ClassificationResponse;
import com.sodam.category.service.ClassificationInternalService;
import com.sodam.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/classifications")
@RequiredArgsConstructor
public class ClassificationController {

    private final ClassificationInternalService service;

    @GetMapping
    public ApiResponse<List<ClassificationResponse>> list(@RequestParam Long accountBookSeq) {
        return ApiResponse.success(service.getClassifications(accountBookSeq));
    }
}
