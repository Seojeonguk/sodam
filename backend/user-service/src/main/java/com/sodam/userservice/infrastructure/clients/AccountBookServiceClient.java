package com.sodam.userservice.infrastructure.clients;

import com.sodam.userservice.config.FeignConfig;
import com.sodam.userservice.infrastructure.dto.request.AccountBookCreateRequest;
import com.sodam.userservice.infrastructure.dto.response.AccountBookResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;

@FeignClient(name = "account-book-service", configuration = FeignConfig.class)
public interface AccountBookServiceClient {

    @PostMapping("/api/account-books")
    AccountBookResponse createAccountBook(AccountBookCreateRequest accountBookCreateRequest);
}
