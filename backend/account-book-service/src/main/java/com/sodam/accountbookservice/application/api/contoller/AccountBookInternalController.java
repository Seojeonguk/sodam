package com.sodam.accountbookservice.application.api.contoller;

import com.sodam.accountbookservice.application.api.dto.AccountBookCreateRequest;
import com.sodam.accountbookservice.application.api.dto.AccountBookResponse;
import com.sodam.accountbookservice.application.service.AccountBookApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/internal/account-books")
public class AccountBookInternalController {

    private final AccountBookApplicationService service;

    @PostMapping
    public AccountBookResponse createAccountBook(@RequestBody AccountBookCreateRequest request) {
        return service.createAccountBook(request, null);
    }
}
