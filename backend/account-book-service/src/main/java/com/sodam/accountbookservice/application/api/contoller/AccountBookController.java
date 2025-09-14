package com.sodam.accountbookservice.application.api.contoller;

import com.sodam.accountbookservice.application.api.dto.AccountBookCreateRequest;
import com.sodam.accountbookservice.application.api.dto.AccountBookResponse;
import com.sodam.accountbookservice.application.service.AccountBookApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/account-books")
public class AccountBookController {
    private final AccountBookApplicationService service;

    @PostMapping
    public ResponseEntity<AccountBookResponse> createAccountBook(@Valid @RequestBody AccountBookCreateRequest request, @RequestHeader("X-User-Email") String email) {
         return ResponseEntity.ok(service.createAccountBook(request, email));
    }
}
