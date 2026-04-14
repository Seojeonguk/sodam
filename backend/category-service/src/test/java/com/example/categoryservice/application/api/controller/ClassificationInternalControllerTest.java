package com.example.categoryservice.application.api.controller;

import com.example.categoryservice.application.api.dto.ClassificationCreateRequest;
import com.example.categoryservice.application.api.dto.ClassificationResponse;
import com.example.categoryservice.application.service.ClassificationInternalService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ClassificationInternalControllerTest {

    @Mock
    private ClassificationInternalService classificationInternalService;

    @InjectMocks
    private ClassificationInternalController classificationInternalController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("createType internal endpoint returns created classification")
    void createType_returnsSuccessResponse() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(classificationInternalController).build();

        ClassificationCreateRequest request = new ClassificationCreateRequest();
        request.setName("수입");
        request.setAccountBookSeq(1L);

        when(classificationInternalService.createType(any(ClassificationCreateRequest.class), any()))
                .thenReturn(ClassificationResponse.builder().id(5L).name("수입").build());

        mockMvc.perform(post("/internal/classifications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("S-00000"))
                .andExpect(jsonPath("$.data.id").value(5L));
    }
}
