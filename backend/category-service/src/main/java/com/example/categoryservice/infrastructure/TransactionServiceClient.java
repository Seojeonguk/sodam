package com.example.categoryservice.infrastructure;

import com.example.categoryservice.config.FeignConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "transaction-service", configuration = FeignConfig.class)
public interface TransactionServiceClient {

    @PutMapping("/api/transactions/category/move")
    ApiResponse<Long> moveCategory(@RequestParam Long oldCategoryId, @RequestParam Long newCategoryId);
}
