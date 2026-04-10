package com.sodam.userservice.infrastructure.clients;

import com.sodam.userservice.infrastructure.dto.request.AccountBookCreateRequest;
import com.sodam.userservice.infrastructure.dto.response.AccountBookResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;

@FeignClient(name = "account-book-service")
public interface AccountBookServiceClient {

    @PostMapping("/internal/account-books")
    AccountBookResponse createAccountBook(AccountBookCreateRequest accountBookCreateRequest);

}
