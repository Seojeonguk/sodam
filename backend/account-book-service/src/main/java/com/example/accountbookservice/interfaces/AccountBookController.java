package com.example.accountbookservice.interfaces;

import com.example.accountbookservice.application.dto.AccountBookCreateRequest;
import com.example.accountbookservice.application.dto.AccountBookResponse;
import com.example.accountbookservice.application.service.AccountBookApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/account-books")
@RequiredArgsConstructor
public class AccountBookController {

    private final AccountBookApplicationService accountBookApplicationService;

    @PostMapping
    public ResponseEntity<Long> create(@RequestBody @Valid AccountBookCreateRequest request,
                                       @RequestHeader("X-USER-SEQ") Long userSeq) {
        Long accountBookId = accountBookApplicationService.createAccountBook(request, userSeq);
        return ResponseEntity.ok(accountBookId);
    }

    @GetMapping
    public ResponseEntity<List<AccountBookResponse>> myAccountBooks(@RequestHeader("X-USER-SEQ") Long userSeq) {
        return ResponseEntity.ok(accountBookApplicationService.getMyAccountBooks(userSeq));
    }
}
