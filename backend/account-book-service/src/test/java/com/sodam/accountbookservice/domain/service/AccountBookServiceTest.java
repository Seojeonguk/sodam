package com.sodam.accountbookservice.domain.service;

import com.sodam.accountbookservice.application.api.dto.AccountBookCreateRequest;
import com.sodam.accountbookservice.application.api.dto.AccountBookListResponse;
import com.sodam.accountbookservice.application.api.dto.AccountBookUpdateRequest;
import com.sodam.accountbookservice.domain.model.AccountBook;
import com.sodam.accountbookservice.domain.repository.AccountBookRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountBookServiceTest {

    @Mock
    private AccountBookRepository accountBookRepository;

    @InjectMocks
    private AccountBookService accountBookService;

    @Test
    @DisplayName("createAccountBook saves account book with user id")
    void createAccountBook_savesAccountBook() {
        AccountBookCreateRequest request = new AccountBookCreateRequest();
        request.setName("main");
        request.setUserId(9L);

        AccountBook saved = AccountBook.builder()
                .name("main")
                .createdBy(9L)
                .updatedBy(9L)
                .build();

        when(accountBookRepository.save(any(AccountBook.class))).thenReturn(saved);

        AccountBook result = accountBookService.createAccountBook(request);

        ArgumentCaptor<AccountBook> captor = ArgumentCaptor.forClass(AccountBook.class);
        verify(accountBookRepository).save(captor.capture());
        assertThat(captor.getValue().getCreatedBy()).isEqualTo(9L);
        assertThat(result.getName()).isEqualTo("main");
    }

    @Test
    @DisplayName("updateAccountBook throws when target does not exist")
    void updateAccountBook_throwsWhenMissing() {
        AccountBookUpdateRequest request = new AccountBookUpdateRequest();
        request.setName("renamed");
        request.setUserId(3L);

        when(accountBookRepository.findById(77L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> accountBookService.updateAccountBook(77L, request))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("deleteAccountBookById throws when target does not exist")
    void deleteAccountBookById_throwsWhenMissing() {
        when(accountBookRepository.findById(77L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> accountBookService.deleteAccountBookById(77L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("getAccountBooks delegates to repository")
    void getAccountBooks_delegatesToRepository() {
        when(accountBookRepository.findAccessibleAccountBooks(5L))
                .thenReturn(List.of(new AccountBookListResponse(1L, "shared", 2, 1)));

        List<AccountBookListResponse> result = accountBookService.getAccountBooks(5L);

        verify(accountBookRepository).findAccessibleAccountBooks(5L);
        assertThat(result).extracting(AccountBookListResponse::getName).containsExactly("shared");
    }
}
