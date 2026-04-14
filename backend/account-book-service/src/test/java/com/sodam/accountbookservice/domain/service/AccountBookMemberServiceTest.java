package com.sodam.accountbookservice.domain.service;

import com.sodam.accountbookservice.domain.model.AccountBookMember;
import com.sodam.accountbookservice.domain.model.Authority;
import com.sodam.accountbookservice.domain.repository.AccountBookMemberRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountBookMemberServiceTest {

    @Mock
    private AccountBookMemberRepository accountBookMemberRepository;

    @InjectMocks
    private AccountBookMemberService accountBookMemberService;

    @Test
    @DisplayName("createAccountBookMember delegates to repository save")
    void createAccountBookMember_savesMember() {
        AccountBookMember member = AccountBookMember.builder()
                .accountBookId(12L)
                .userId(1L)
                .authority(Authority.OWNER)
                .isAvailable("Y")
                .createdBy(1L)
                .updatedBy(1L)
                .build();

        when(accountBookMemberRepository.save(any(AccountBookMember.class))).thenReturn(member);

        AccountBookMember result = accountBookMemberService.createAccountBookMember(member);

        ArgumentCaptor<AccountBookMember> captor = ArgumentCaptor.forClass(AccountBookMember.class);
        verify(accountBookMemberRepository).save(captor.capture());
        assertThat(captor.getValue().getAuthority()).isEqualTo(Authority.OWNER);
        assertThat(result.getAccountBookId()).isEqualTo(12L);
    }
}
