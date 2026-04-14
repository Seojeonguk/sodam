package com.sodam.accountbookservice.application.service;

import com.sodam.accountbookservice.application.api.dto.AccountBookCreateRequest;
import com.sodam.accountbookservice.application.api.dto.AccountBookListResponse;
import com.sodam.accountbookservice.application.api.dto.AccountBookResponse;
import com.sodam.accountbookservice.application.api.dto.AccountBookUpdateRequest;
import com.sodam.accountbookservice.domain.model.AccountBook;
import com.sodam.accountbookservice.domain.model.AccountBookMember;
import com.sodam.accountbookservice.domain.model.Authority;
import com.sodam.accountbookservice.domain.service.AccountBookMemberService;
import com.sodam.accountbookservice.domain.service.AccountBookService;
import com.sodam.accountbookservice.infrastructure.UserDto;
import com.sodam.accountbookservice.infrastructure.UserServiceClient;
import com.sodam.common.integration.ExternalResponseValidator;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.util.Strings;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AccountBookApplicationService {

    private final AccountBookService accountBookService;
    private final AccountBookMemberService accountBookMemberService;
    private final UserServiceClient userServiceClient;

    @Transactional
    public AccountBookResponse createAccountBook(AccountBookCreateRequest request, String email) {
        if (request.getUserId() == null && Strings.isEmpty(email)) {
            throw new IllegalArgumentException("User information is required.");
        }

        Long userId = request.getUserId();
        if (userId == null) {
            userId = resolveUserId(email);
            request.setUserId(userId);
        }

        AccountBook accountBook = accountBookService.createAccountBook(request);

        AccountBookMember accountBookMember = AccountBookMember.builder()
                .accountBookId(accountBook.getId())
                .createdBy(userId)
                .updatedBy(userId)
                .authority(Authority.OWNER)
                .isAvailable("Y")
                .userId(userId)
                .build();

        AccountBookMember createdAccountBookMember = accountBookMemberService.createAccountBookMember(accountBookMember);
        if (createdAccountBookMember == null) {
            throw new IllegalArgumentException("Failed to create account book owner membership.");
        }

        return AccountBookResponse.builder()
                .id(accountBook.getId())
                .name(accountBook.getName())
                .updatedAt(accountBook.getUpdatedAt())
                .build();
    }

    public AccountBookResponse updateAccountBook(Long id, AccountBookUpdateRequest request, String email) {
        request.setUserId(resolveUserId(email));

        AccountBook accountBook = accountBookService.updateAccountBook(id, request);

        return AccountBookResponse.builder()
                .id(accountBook.getId())
                .name(accountBook.getName())
                .updatedAt(accountBook.getUpdatedAt())
                .build();
    }

    public AccountBookResponse getAccountBook(Long id, String email) {
        AccountBook accountBook = accountBookService.getAccountBookById(id);

        return AccountBookResponse.builder()
                .id(accountBook.getId())
                .name(accountBook.getName())
                .updatedAt(accountBook.getUpdatedAt())
                .build();
    }

    public void deleteAccountBook(Long id, String email) {
        accountBookService.deleteAccountBookById(id);
    }

    public List<AccountBookListResponse> getAccountBooks(String email) {
        return accountBookService.getAccountBooks(resolveUserId(email));
    }

    private Long resolveUserId(String email) {
        UserDto user = ExternalResponseValidator.requireData(userServiceClient.getUser(email), "user-service");
        return ExternalResponseValidator.requireField(user, UserDto::getId, "user-service", "user id");
    }
}
