package com.sodam.userservice.infrastructure.clients;

import com.sodam.userservice.infrastructure.dto.request.ClassificationCreateRequest;
import com.sodam.userservice.infrastructure.dto.response.ClassificationResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;

@FeignClient(name = "category-service")
public interface ClassificationServiceClient {

    @PostMapping("/internal/classifications")
    ClassificationResponse createType(ClassificationCreateRequest classificationCreateRequest);
}