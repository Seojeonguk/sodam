package com.sodam.accountbook.service;

import com.sodam.accountbook.domain.AccountBook;
import com.sodam.accountbook.domain.AccountBookMember;
import com.sodam.accountbook.domain.Authority;
import com.sodam.accountbook.dto.*;
import com.sodam.category.service.ClassificationInternalService;
import com.sodam.category.dto.ClassificationCreateRequest;
import com.sodam.user.domain.User;
import com.sodam.user.service.AccountBookRegistrar;
import com.sodam.user.service.UserDomainService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.logging.log4j.util.Strings;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccountBookApplicationService implements AccountBookRegistrar {

    private final AccountBookService accountBookService;
    private final AccountBookMemberService accountBookMemberService;
    private final UserDomainService userDomainService;
    private final ClassificationInternalService classificationInternalService;

    /**
     * 회원가입 시 기본 가계부 + 분류(INCOME/EXPENSE) 자동 생성
     * AccountBookRegistrar 인터페이스를 통해 순환 의존성 방지
     */
    @Override
    @Transactional
    public void createDefaultAccountBookForUser(User user) {
        AccountBookCreateRequest createRequest = new AccountBookCreateRequest();
        createRequest.setName("가계부");
        createRequest.setUserId(user.getId());

        AccountBookResponse created = createAccountBook(createRequest, null);
        log.debug("기본 가계부 생성: id={}", created.getId());

        ClassificationCreateRequest incomeReq = new ClassificationCreateRequest();
        incomeReq.setName("INCOME");
        incomeReq.setAccountBookSeq(created.getId());
        classificationInternalService.createType(incomeReq, user.getEmail());

        ClassificationCreateRequest expenseReq = new ClassificationCreateRequest();
        expenseReq.setName("EXPENSE");
        expenseReq.setAccountBookSeq(created.getId());
        classificationInternalService.createType(expenseReq, user.getEmail());
    }

    @Transactional
    public AccountBookResponse createAccountBook(AccountBookCreateRequest request, String email) {
        if (request.getUserId() == null && (email == null || email.isBlank())) {
            throw new IllegalArgumentException("User information is required.");
        }

        Long userId = request.getUserId();
        if (userId == null) {
            userId = userDomainService.findUserByEmail(email).getId();
            request.setUserId(userId);
        }

        AccountBook accountBook = accountBookService.createAccountBook(request);

        AccountBookMember member = AccountBookMember.builder()
                .accountBookId(accountBook.getId())
                .createdBy(userId)
                .updatedBy(userId)
                .authority(Authority.OWNER)
                .isAvailable("Y")
                .userId(userId)
                .build();
        accountBookMemberService.createAccountBookMember(member);

        return AccountBookResponse.builder()
                .id(accountBook.getId())
                .name(accountBook.getName())
                .updatedAt(accountBook.getUpdatedAt())
                .build();
    }

    @Transactional
    public AccountBookResponse updateAccountBook(Long id, AccountBookUpdateRequest request, String email) {
        request.setUserId(userDomainService.findUserByEmail(email).getId());
        AccountBook accountBook = accountBookService.updateAccountBook(id, request);
        return AccountBookResponse.builder()
                .id(accountBook.getId())
                .name(accountBook.getName())
                .updatedAt(accountBook.getUpdatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public AccountBookResponse getAccountBook(Long id, String email) {
        AccountBook accountBook = accountBookService.getAccountBookById(id);
        return AccountBookResponse.builder()
                .id(accountBook.getId())
                .name(accountBook.getName())
                .updatedAt(accountBook.getUpdatedAt())
                .build();
    }

    @Transactional
    public void deleteAccountBook(Long id, String email) {
        accountBookService.deleteAccountBookById(id);
    }

    @Transactional(readOnly = true)
    public List<AccountBookListResponse> getAccountBooks(String email) {
        Long userId = userDomainService.findUserByEmail(email).getId();
        return accountBookService.getAccountBooks(userId);
    }
}
