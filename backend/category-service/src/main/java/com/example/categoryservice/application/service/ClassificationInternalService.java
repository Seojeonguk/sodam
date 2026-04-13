package com.example.categoryservice.application.service;

import com.example.categoryservice.application.api.dto.ClassificationCreateRequest;
import com.example.categoryservice.application.api.dto.ClassificationResponse;
import com.example.categoryservice.domain.model.Classification;
import com.example.categoryservice.domain.service.ClassificationService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
@Slf4j
public class ClassificationInternalService {

    private final ClassificationService classificationService;

    public ClassificationResponse createType(ClassificationCreateRequest request, String email) {
        log.info("Create type of classification : {}", request);
        if (request.getAccountBookSeq() == null) {
            throw new IllegalArgumentException("가계부 정보가 존재하지 않습니다.");
        }

        Classification classification = classificationService.createType(request);

        return ClassificationResponse.from(classification);
    }

    public List<ClassificationResponse> getClassifications(Long accountBookSeq) {
        if (accountBookSeq == null) {
            throw new IllegalArgumentException("가계부 정보가 존재하지 않습니다.");
        }

        return classificationService.getClassifications(accountBookSeq).stream()
                .map(ClassificationResponse::from)
                .toList();
    }
}
