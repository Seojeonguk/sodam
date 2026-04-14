package com.sodam.accountbookservice.application.service;

import com.sodam.common.exception.CustomException;
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
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountBookApplicationServiceTest {

    @Mock
    private AccountBookService accountBookService;

    @Mock
    private AccountBookMemberService accountBookMemberService;

    @Mock
    private UserServiceClient userServiceClient;

    @InjectMocks
    private AccountBookApplicationService accountBookApplicationService;

    @Test
    @DisplayName("createAccountBook resolves user by email and creates owner membership")
    void createAccountBook_createsOwnerMembership() {
        AccountBookCreateRequest request = new AccountBookCreateRequest();
        request.setName("main");

        UserDto userDto = new UserDto();
        userDto.setId(4L);

        AccountBook accountBook = AccountBook.builder()
                .name("main")
                .createdBy(4L)
                .updatedBy(4L)
                .build();
        ReflectionTestUtils.setField(accountBook, "id", 99L);
        ReflectionTestUtils.setField(accountBook, "updatedAt", "20260414120000");

        AccountBookMember member = AccountBookMember.builder()
                .accountBookId(99L)
                .userId(4L)
                .authority(Authority.OWNER)
                .isAvailable("Y")
                .createdBy(4L)
                .updatedBy(4L)
                .build();

        when(userServiceClient.getUser("user@example.com")).thenReturn(ApiResponse.success(userDto));
        when(accountBookService.createAccountBook(any(AccountBookCreateRequest.class))).thenReturn(accountBook);
        when(accountBookMemberService.createAccountBookMember(any(AccountBookMember.class))).thenReturn(member);

        AccountBookResponse response =
                accountBookApplicationService.createAccountBook(request, "user@example.com");

        ArgumentCaptor<AccountBookCreateRequest> requestCaptor =
                ArgumentCaptor.forClass(AccountBookCreateRequest.class);
        verify(accountBookService).createAccountBook(requestCaptor.capture());
        assertThat(requestCaptor.getValue().getUserId()).isEqualTo(4L);

        ArgumentCaptor<AccountBookMember> memberCaptor = ArgumentCaptor.forClass(AccountBookMember.class);
        verify(accountBookMemberService).createAccountBookMember(memberCaptor.capture());
        assertThat(memberCaptor.getValue().getAuthority()).isEqualTo(Authority.OWNER);
        assertThat(response.getId()).isEqualTo(99L);
    }

    @Test
    @DisplayName("createAccountBook throws when no user information is provided")
    void createAccountBook_throwsWhenUserInfoMissing() {
        AccountBookCreateRequest request = new AccountBookCreateRequest();
        request.setName("main");

        assertThatThrownBy(() -> accountBookApplicationService.createAccountBook(request, ""))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("updateAccountBook resolves user id and returns response")
    void updateAccountBook_resolvesUserId() {
        AccountBookUpdateRequest request = new AccountBookUpdateRequest();
        request.setName("renamed");

        UserDto userDto = new UserDto();
        userDto.setId(7L);

        AccountBook accountBook = AccountBook.builder()
                .name("renamed")
                .createdBy(7L)
                .updatedBy(7L)
                .build();
        ReflectionTestUtils.setField(accountBook, "id", 15L);
        ReflectionTestUtils.setField(accountBook, "updatedAt", "20260414130000");

        when(userServiceClient.getUser("user@example.com")).thenReturn(ApiResponse.success(userDto));
        when(accountBookService.updateAccountBook(eq(15L), any(AccountBookUpdateRequest.class))).thenReturn(accountBook);

        AccountBookResponse response =
                accountBookApplicationService.updateAccountBook(15L, request, "user@example.com");

        assertThat(request.getUserId()).isEqualTo(7L);
        assertThat(response.getName()).isEqualTo("renamed");
    }

    @Test
    @DisplayName("getAccountBooks returns accessible account books for resolved user")
    void getAccountBooks_returnsResolvedUserAccountBooks() {
        UserDto userDto = new UserDto();
        userDto.setId(10L);

        when(userServiceClient.getUser("user@example.com")).thenReturn(ApiResponse.success(userDto));
        when(accountBookService.getAccountBooks(10L))
                .thenReturn(List.of(new AccountBookListResponse(1L, "main", 1, 1)));

        List<AccountBookListResponse> response =
                accountBookApplicationService.getAccountBooks("user@example.com");

        assertThat(response).hasSize(1);
        assertThat(response.get(0).getName()).isEqualTo("main");
    }

    @Test
    @DisplayName("createAccountBook skips user lookup when request already has userId")
    void createAccountBook_skipsUserLookupWhenUserIdProvided() {
        AccountBookCreateRequest request = new AccountBookCreateRequest();
        request.setName("team");
        request.setUserId(21L);

        AccountBook accountBook = AccountBook.builder()
                .name("team")
                .createdBy(21L)
                .updatedBy(21L)
                .build();
        ReflectionTestUtils.setField(accountBook, "id", 55L);
        ReflectionTestUtils.setField(accountBook, "updatedAt", "20260414150000");

        AccountBookMember member = AccountBookMember.builder()
                .accountBookId(55L)
                .userId(21L)
                .authority(Authority.OWNER)
                .isAvailable("Y")
                .createdBy(21L)
                .updatedBy(21L)
                .build();

        when(accountBookService.createAccountBook(any(AccountBookCreateRequest.class))).thenReturn(accountBook);
        when(accountBookMemberService.createAccountBookMember(any(AccountBookMember.class))).thenReturn(member);

        AccountBookResponse response = accountBookApplicationService.createAccountBook(request, null);

        assertThat(response.getId()).isEqualTo(55L);
        verify(userServiceClient, never()).getUser(any());
    }

    @Test
    @DisplayName("createAccountBook throws when owner membership creation fails")
    void createAccountBook_throwsWhenOwnerMembershipCreationFails() {
        AccountBookCreateRequest request = new AccountBookCreateRequest();
        request.setName("main");
        request.setUserId(4L);

        AccountBook accountBook = AccountBook.builder()
                .name("main")
                .createdBy(4L)
                .updatedBy(4L)
                .build();
        ReflectionTestUtils.setField(accountBook, "id", 99L);
        ReflectionTestUtils.setField(accountBook, "updatedAt", "20260414120000");

        when(accountBookService.createAccountBook(any(AccountBookCreateRequest.class))).thenReturn(accountBook);
        when(accountBookMemberService.createAccountBookMember(any(AccountBookMember.class))).thenReturn(null);

        assertThatThrownBy(() -> accountBookApplicationService.createAccountBook(request, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("getAccountBook returns mapped response")
    void getAccountBook_returnsMappedResponse() {
        AccountBook accountBook = AccountBook.builder()
                .name("household")
                .createdBy(7L)
                .updatedBy(7L)
                .build();
        ReflectionTestUtils.setField(accountBook, "id", 17L);
        ReflectionTestUtils.setField(accountBook, "updatedAt", "20260414153000");

        when(accountBookService.getAccountBookById(17L)).thenReturn(accountBook);

        AccountBookResponse response = accountBookApplicationService.getAccountBook(17L, "user@example.com");

        assertThat(response.getId()).isEqualTo(17L);
        assertThat(response.getName()).isEqualTo("household");
    }

    @Test
    @DisplayName("deleteAccountBook delegates to service")
    void deleteAccountBook_delegatesToService() {
        accountBookApplicationService.deleteAccountBook(13L, "user@example.com");

        verify(accountBookService).deleteAccountBookById(13L);
    }

    @Test
    @DisplayName("createAccountBook throws custom exception when user response data is missing")
    void createAccountBook_throwsWhenUserResponseDataMissing() {
        AccountBookCreateRequest request = new AccountBookCreateRequest();
        request.setName("main");

        when(userServiceClient.getUser("user@example.com")).thenReturn(ApiResponse.success(null));

        assertThatThrownBy(() -> accountBookApplicationService.createAccountBook(request, "user@example.com"))
                .isInstanceOf(CustomException.class)
                .hasMessageContaining("user-service");
    }

    @Test
    @DisplayName("getAccountBooks throws custom exception when user id is missing")
    void getAccountBooks_throwsWhenUserIdMissing() {
        UserDto userDto = new UserDto();
        userDto.setEmail("user@example.com");

        when(userServiceClient.getUser("user@example.com")).thenReturn(ApiResponse.success(userDto));

        assertThatThrownBy(() -> accountBookApplicationService.getAccountBooks("user@example.com"))
                .isInstanceOf(CustomException.class)
                .hasMessageContaining("user id");
    }
}
