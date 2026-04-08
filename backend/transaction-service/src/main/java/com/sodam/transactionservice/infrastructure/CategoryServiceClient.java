package com.sodam.transactionservice.infrastructure;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "category-service")
public interface CategoryServiceClient {

    @GetMapping("/internal/categories")
    List<CategoryListItemResponse> getCategoriesByIds(@RequestParam(value = "ids") List<Long> ids);

}
