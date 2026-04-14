package com.sodam.transactionservice.application.api.controller;

import com.sodam.common.exception.GlobalExceptionHandler;
import com.sodam.transactionservice.application.service.TransactionApplicationService;
import feign.FeignException;
import feign.Request;
import feign.RequestTemplate;
import java.nio.charset.StandardCharsets;
import java.util.NoSuchElementException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class TransactionControllerExceptionHandlingTest {

    @Mock
    private TransactionApplicationService transactionApplicationService;

    @InjectMocks
    private TransactionController transactionController;

    @Test
    @DisplayName("illegal argument from controller is converted to bad request response")
    void illegalArgument_isConvertedToBadRequest() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        doThrow(new IllegalArgumentException("bad input"))
                .when(transactionApplicationService).deleteTransaction(5L);

        mockMvc.perform(delete("/api/transactions/5"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("E-00001"))
                .andExpect(jsonPath("$.message").value("bad input"));
    }

    @Test
    @DisplayName("feign exception from controller is converted to bad gateway response")
    void feignException_isConvertedToBadGateway() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        when(transactionApplicationService.getTransactionById(7L))
                .thenThrow(feignException());

        mockMvc.perform(get("/api/transactions/7"))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.code").value("E-00006"));
    }

    @Test
    @DisplayName("unexpected exception from controller is converted to internal server error")
    void noSuchElement_isConvertedToInternalServerError() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        when(transactionApplicationService.getTransactionById(8L))
                .thenThrow(new NoSuchElementException("missing"));

        mockMvc.perform(get("/api/transactions/8"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.code").value("E-00000"));
    }

    private MockMvc buildMockMvc() {
        return MockMvcBuilders.standaloneSetup(transactionController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    private FeignException feignException() {
        return FeignException.errorStatus(
                "CategoryClient#getCategory",
                feign.Response.builder()
                        .status(503)
                        .reason("Service Unavailable")
                        .request(Request.create(
                                Request.HttpMethod.GET,
                                "http://localhost/categories/7",
                                java.util.Map.of(),
                                null,
                                StandardCharsets.UTF_8,
                                new RequestTemplate()
                        ))
                        .build()
        );
    }
}
