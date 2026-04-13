package com.example.categoryservice.domain.service;

import com.example.categoryservice.application.api.dto.ClassificationCreateRequest;
import com.example.categoryservice.domain.model.Classification;
import com.example.categoryservice.domain.repository.TypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClassificationService {

    private final TypeRepository typeRepository;

    @Transactional
    public Classification createType(ClassificationCreateRequest request) {
        Classification classification = Classification.builder()
                .name(request.getName())
                .accountBookSeq(request.getAccountBookSeq())
                .build();

        return typeRepository.save(classification);
    }

    @Transactional(readOnly = true)
    public List<Classification> getClassifications(Long accountBookSeq) {
        return typeRepository.findAllByAccountBookSeqOrderByIdAsc(accountBookSeq);
    }
}
