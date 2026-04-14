package com.example.categoryservice.application.service;

import com.example.categoryservice.application.api.dto.ClassificationCreateRequest;
import com.example.categoryservice.application.api.dto.ClassificationResponse;
import com.example.categoryservice.domain.model.Classification;
import com.example.categoryservice.domain.service.ClassificationService;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClassificationInternalServiceTest {

    @Mock
    private ClassificationService classificationService;

    @InjectMocks
    private ClassificationInternalService classificationInternalService;

    @Test
    @DisplayName("createType throws when accountBookSeq is missing")
    void createType_throwsWhenAccountBookSeqMissing() {
        ClassificationCreateRequest request = new ClassificationCreateRequest();
        request.setName("수입");

        assertThatThrownBy(() -> classificationInternalService.createType(request, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("createType maps saved classification to response")
    void createType_returnsResponse() {
        ClassificationCreateRequest request = new ClassificationCreateRequest();
        request.setName("지출");
        request.setAccountBookSeq(12L);

        Classification classification = Classification.builder()
                .name("지출")
                .accountBookSeq(12L)
                .build();
        ReflectionTestUtils.setField(classification, "id", 3L);

        when(classificationService.createType(any(ClassificationCreateRequest.class)))
                .thenReturn(classification);

        ClassificationResponse response = classificationInternalService.createType(request, null);

        verify(classificationService).createType(request);
        assertThat(response.getId()).isEqualTo(3L);
        assertThat(response.getName()).isEqualTo("지출");
    }

    @Test
    @DisplayName("getClassifications throws when accountBookSeq is missing")
    void getClassifications_throwsWhenAccountBookSeqMissing() {
        assertThatThrownBy(() -> classificationInternalService.getClassifications(null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("getClassifications maps all classifications")
    void getClassifications_returnsMappedResponses() {
        Classification income = Classification.builder()
                .name("수입")
                .accountBookSeq(8L)
                .build();
        Classification expense = Classification.builder()
                .name("지출")
                .accountBookSeq(8L)
                .build();
        ReflectionTestUtils.setField(income, "id", 1L);
        ReflectionTestUtils.setField(expense, "id", 2L);

        when(classificationService.getClassifications(8L)).thenReturn(List.of(income, expense));

        List<ClassificationResponse> responses = classificationInternalService.getClassifications(8L);

        assertThat(responses).hasSize(2);
        assertThat(responses).extracting(ClassificationResponse::getName)
                .containsExactly("수입", "지출");
    }
}
