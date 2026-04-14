package com.example.categoryservice.application.api.controller;

import com.example.categoryservice.application.api.dto.ClassificationResponse;
import com.example.categoryservice.application.service.ClassificationInternalService;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ClassificationControllerTest {

    @Mock
    private ClassificationInternalService classificationInternalService;

    @InjectMocks
    private ClassificationController classificationController;

    @Test
    @DisplayName("getClassifications endpoint returns classification list")
    void getClassifications_returnsSuccessResponse() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(classificationController).build();

        when(classificationInternalService.getClassifications(15L)).thenReturn(List.of(
                ClassificationResponse.builder().id(1L).name("수입").build(),
                ClassificationResponse.builder().id(2L).name("지출").build()
        ));

        mockMvc.perform(get("/api/classifications")
                        .param("accountBookSeq", "15"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("S-00000"))
                .andExpect(jsonPath("$.data[0].name").value("수입"))
                .andExpect(jsonPath("$.data[1].name").value("지출"));
    }
}
