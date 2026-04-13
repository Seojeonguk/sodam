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
import com.sodam.common.response.ApiResponse;
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
            throw new IllegalArgumentException("사용자 정보가 존재하지 않습니다.");
        }

        Long userId = request.getUserId();
        if (userId == null) {
            ApiResponse<UserDto> userResponse = userServiceClient.getUser(email);
            request.setUserId(userResponse.getData().getId());
            userId = userResponse.getData().getId();
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
            throw new IllegalArgumentException("생성된 가계부 권한이 없습니다.");
        }

        return AccountBookResponse.builder()
                .id(accountBook.getId())
                .name(accountBook.getName())
                .updatedAt(accountBook.getUpdatedAt())
                .build();
    }

    public AccountBookResponse updateAccountBook(Long id, AccountBookUpdateRequest request, String email) {
        ApiResponse<UserDto> userResponse = userServiceClient.getUser(email);
        request.setUserId(userResponse.getData().getId());

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
        ApiResponse<UserDto> userResponse = userServiceClient.getUser(email);

        Long userId = userResponse.getData().getId();

        return accountBookService.getAccountBooks(userId);
    }
}
