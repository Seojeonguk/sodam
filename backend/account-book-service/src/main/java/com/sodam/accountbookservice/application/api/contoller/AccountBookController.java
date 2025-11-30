package com.sodam.accountbookservice.application.api.contoller;

import com.sodam.accountbookservice.application.api.dto.AccountBookCreateRequest;
import com.sodam.accountbookservice.application.api.dto.AccountBookListResponse;
import com.sodam.accountbookservice.application.api.dto.AccountBookResponse;
import com.sodam.accountbookservice.application.api.dto.AccountBookUpdateRequest;
import com.sodam.accountbookservice.application.service.AccountBookApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/account-books")
public class AccountBookController {
    private final AccountBookApplicationService service;

    @GetMapping()
    public ResponseEntity<List<AccountBookListResponse>> getAccountBooks(@RequestHeader("X-User-Email") String email) {
        return ResponseEntity.ok(service.getAccountBooks(email));
    }

    @PostMapping
    public ResponseEntity<AccountBookResponse> createAccountBook(@Valid @RequestBody AccountBookCreateRequest request, @RequestHeader("X-User-Email") String email) {
        return ResponseEntity.ok(service.createAccountBook(request, email));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AccountBookResponse> updateAccountBook(@PathVariable Long id, @Valid @RequestBody AccountBookUpdateRequest request, @RequestHeader("X-User-Email") String email) {
        return ResponseEntity.ok(service.updateAccountBook(id, request, email));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccountBookResponse> getAccountBook(@PathVariable Long id, @RequestHeader("X-User-Email") String email) {
        return ResponseEntity.ok(service.getAccountBook(id, email));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccountBook(@PathVariable Long id, @RequestHeader("X-User-Email") String email) {
        service.deleteAccountBook(id, email);
        return ResponseEntity.noContent().build();
    }
}
