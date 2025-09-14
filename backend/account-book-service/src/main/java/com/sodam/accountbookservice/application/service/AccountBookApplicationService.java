package com.sodam.accountbookservice.application.service;

import com.sodam.accountbookservice.application.api.dto.AccountBookCreateRequest;
import com.sodam.accountbookservice.application.api.dto.AccountBookResponse;
import com.sodam.accountbookservice.application.api.dto.AccountBookUpdateRequest;
import com.sodam.accountbookservice.domain.model.AccountBook;
import com.sodam.accountbookservice.domain.service.AccountBookService;
import com.sodam.accountbookservice.infrastructure.ApiResponse;
import com.sodam.accountbookservice.infrastructure.UserDto;
import com.sodam.accountbookservice.infrastructure.UserServiceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AccountBookApplicationService {

    private final AccountBookService accountBookService;

    private final UserServiceClient userServiceClient;

    @Transactional
    public AccountBookResponse createAccountBook(AccountBookCreateRequest request, String email) {

        ApiResponse<UserDto> userResponse = userServiceClient.getUser(email);
        request.setUserId(userResponse.getData().getId());

        AccountBook accountBook = accountBookService.createAccountBook(request);

        return AccountBookResponse.builder()
                .name(accountBook.getName())
                .updatedAt(accountBook.getUpdatedAt())
                .build();
    }

    public AccountBookResponse updateAccountBook(Long id, AccountBookUpdateRequest request, String email) {
        ApiResponse<UserDto> userResponse = userServiceClient.getUser(email);
        request.setUserId(userResponse.getData().getId());

        AccountBook accountBook = accountBookService.updateAccountBook(id, request);

        return AccountBookResponse.builder()
                .name(accountBook.getName())
                .updatedAt(accountBook.getUpdatedAt())
                .build();
    }

    public AccountBookResponse getAccountBook(Long id, String email) {
        AccountBook accountBook = accountBookService.getAccountBookById(id);

        return AccountBookResponse.builder()
                .name(accountBook.getName())
                .updatedAt(accountBook.getUpdatedAt())
                .build();
    }

    public void deleteAccountBook(Long id, String email) {
        accountBookService.deleteAccountBookById(id);
    }
}
