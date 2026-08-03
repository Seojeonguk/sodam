package com.sodam.category.service;

import com.sodam.category.domain.Classification;
import com.sodam.category.dto.ClassificationCreateRequest;
import com.sodam.category.dto.ClassificationResponse;
import com.sodam.category.repository.ClassificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClassificationInternalService {

    private final ClassificationRepository classificationRepository;

    @Transactional
    public ClassificationResponse createType(ClassificationCreateRequest request, String email) {
        if (request.getAccountBookSeq() == null)
            throw new IllegalArgumentException("가계부 정보가 존재하지 않습니다.");
        Classification c = Classification.builder()
                .name(request.getName()).accountBookSeq(request.getAccountBookSeq()).build();
        return ClassificationResponse.from(classificationRepository.save(c));
    }

    @Transactional(readOnly = true)
    public List<ClassificationResponse> getClassifications(Long accountBookSeq) {
        if (accountBookSeq == null) throw new IllegalArgumentException("가계부 정보가 존재하지 않습니다.");
        return classificationRepository.findByAccountBookSeq(accountBookSeq).stream()
                .map(ClassificationResponse::from).toList();
    }
}
