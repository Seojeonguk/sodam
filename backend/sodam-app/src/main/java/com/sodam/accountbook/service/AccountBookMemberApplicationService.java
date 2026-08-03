package com.sodam.accountbook.service;

import com.sodam.accountbook.domain.AccountBookMember;
import com.sodam.accountbook.domain.Authority;
import com.sodam.accountbook.dto.MemberAuthorityUpdateRequest;
import com.sodam.accountbook.dto.MemberInviteRequest;
import com.sodam.accountbook.dto.MemberResponse;
import com.sodam.user.domain.User;
import com.sodam.user.service.UserDomainService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccountBookMemberApplicationService {

    private static final String FAR_FUTURE = "99991231235959";

    private final AccountBookMemberService memberService;
    private final UserDomainService userDomainService;

    @Transactional(readOnly = true)
    public List<MemberResponse> getMembers(Long accountBookId, String requesterEmail) {
        Long requesterId = userDomainService.findUserByEmail(requesterEmail).getId();
        if (!memberService.isMember(accountBookId, requesterId)) {
            throw new IllegalArgumentException("해당 가계부의 멤버가 아닙니다.");
        }

        List<AccountBookMember> members = memberService.findByAccountBookId(accountBookId);
        List<Long> userIds = members.stream().map(AccountBookMember::getUserId).toList();
        Map<Long, User> userMap = fetchUsers(userIds);

        return members.stream()
                .map(m -> MemberResponse.of(m, userMap.get(m.getUserId())))
                .collect(Collectors.toList());
    }

    @Transactional
    public MemberResponse inviteMember(Long accountBookId, MemberInviteRequest request, String requesterEmail) {
        Long requesterId = userDomainService.findUserByEmail(requesterEmail).getId();
        if (!memberService.isOwner(accountBookId, requesterId)) {
            throw new IllegalArgumentException("가계부 소유자만 멤버를 초대할 수 있습니다.");
        }
        if (request.getAuthority() == Authority.OWNER) {
            throw new IllegalArgumentException("OWNER 권한으로 초대할 수 없습니다.");
        }

        User invitee = userDomainService.findUserByEmail(request.getEmail());
        if (memberService.isMember(accountBookId, invitee.getId())) {
            throw new IllegalArgumentException("이미 가계부 멤버입니다.");
        }

        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        AccountBookMember newMember = AccountBookMember.builder()
                .accountBookId(accountBookId)
                .userId(invitee.getId())
                .authority(request.getAuthority())
                .isAvailable("Y")
                .availableFrom(now)
                .availableTo(FAR_FUTURE)
                .createdBy(requesterId)
                .updatedBy(requesterId)
                .build();

        AccountBookMember saved = memberService.createAccountBookMember(newMember);
        return MemberResponse.of(saved, invitee);
    }

    @Transactional
    public MemberResponse updateAuthority(Long accountBookId, Long targetUserId,
                                          MemberAuthorityUpdateRequest request, String requesterEmail) {
        Long requesterId = userDomainService.findUserByEmail(requesterEmail).getId();
        if (!memberService.isOwner(accountBookId, requesterId)) {
            throw new IllegalArgumentException("가계부 소유자만 권한을 변경할 수 있습니다.");
        }
        if (request.getAuthority() == Authority.OWNER) {
            throw new IllegalArgumentException("OWNER 권한으로 변경할 수 없습니다.");
        }
        if (targetUserId.equals(requesterId)) {
            throw new IllegalArgumentException("본인의 권한은 변경할 수 없습니다.");
        }

        AccountBookMember updated = memberService.updateAuthority(accountBookId, targetUserId, request.getAuthority());
        User user = userDomainService.findUserById(targetUserId);
        return MemberResponse.of(updated, user);
    }

    @Transactional
    public void removeMember(Long accountBookId, Long targetUserId, String requesterEmail) {
        Long requesterId = userDomainService.findUserByEmail(requesterEmail).getId();
        if (!memberService.isOwner(accountBookId, requesterId)) {
            throw new IllegalArgumentException("가계부 소유자만 멤버를 삭제할 수 있습니다.");
        }
        if (targetUserId.equals(requesterId)) {
            throw new IllegalArgumentException("본인은 삭제할 수 없습니다.");
        }
        memberService.removeMember(accountBookId, targetUserId);
    }

    private Map<Long, User> fetchUsers(List<Long> userIds) {
        if (userIds.isEmpty()) return Map.of();
        return userDomainService.findUsersByIds(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));
    }
}
