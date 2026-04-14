package com.example.categoryservice.domain.service;

import com.example.categoryservice.application.api.dto.ClassificationCreateRequest;
import com.example.categoryservice.domain.model.Classification;
import com.example.categoryservice.domain.repository.TypeRepository;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClassificationServiceTest {

    @Mock
    private TypeRepository typeRepository;

    @InjectMocks
    private ClassificationService classificationService;

    @Test
    @DisplayName("createType builds and saves classification")
    void createType_savesClassification() {
        ClassificationCreateRequest request = new ClassificationCreateRequest();
        request.setName("고정비");
        request.setAccountBookSeq(22L);

        Classification saved = Classification.builder()
                .name("고정비")
                .accountBookSeq(22L)
                .build();

        when(typeRepository.save(any(Classification.class))).thenReturn(saved);

        Classification result = classificationService.createType(request);

        ArgumentCaptor<Classification> captor = ArgumentCaptor.forClass(Classification.class);
        verify(typeRepository).save(captor.capture());
        assertThat(captor.getValue().getName()).isEqualTo("고정비");
        assertThat(captor.getValue().getAccountBookSeq()).isEqualTo(22L);
        assertThat(result.getName()).isEqualTo("고정비");
    }

    @Test
    @DisplayName("getClassifications delegates to repository")
    void getClassifications_delegatesToRepository() {
        Classification income = Classification.builder()
                .name("수입")
                .accountBookSeq(4L)
                .build();

        when(typeRepository.findAllByAccountBookSeqOrderByIdAsc(4L)).thenReturn(List.of(income));

        List<Classification> result = classificationService.getClassifications(4L);

        verify(typeRepository).findAllByAccountBookSeqOrderByIdAsc(4L);
        assertThat(result).hasSize(1);
    }
}
