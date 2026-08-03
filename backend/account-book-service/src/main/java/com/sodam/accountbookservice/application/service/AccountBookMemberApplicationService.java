package com.sodam.accountbookservice.application.service;

import com.sodam.accountbookservice.application.api.dto.MemberAuthorityUpdateRequest;
import com.sodam.accountbookservice.application.api.dto.MemberInviteRequest;
import com.sodam.accountbookservice.application.api.dto.MemberResponse;
import com.sodam.accountbookservice.domain.model.AccountBookMember;
import com.sodam.accountbookservice.domain.model.Authority;
import com.sodam.accountbookservice.domain.service.AccountBookMemberService;
import com.sodam.accountbookservice.infrastructure.UserDto;
import com.sodam.accountbookservice.infrastructure.UserServiceClient;
import com.sodam.common.integration.ExternalResponseValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccountBookMemberApplicationService {

    private static final String FAR_FUTURE = "99991231235959";

    private final AccountBookMemberService memberService;
    private final UserServiceClient userServiceClient;

    /** 멤버 목록 조회 (요청자도 멤버여야 함) */
    @Transactional(readOnly = true)
    public List<MemberResponse> getMembers(Long accountBookId, String requesterEmail) {
        Long requesterId = resolveUserId(requesterEmail);
        if (!memberService.isMember(accountBookId, requesterId)) {
            throw new IllegalArgumentException("해당 가계부의 멤버가 아닙니다.");
        }

        List<AccountBookMember> members = memberService.findByAccountBookId(accountBookId);
        List<Long> userIds = members.stream().map(AccountBookMember::getUserId).toList();

        Map<Long, UserDto> userMap = fetchUsers(userIds);

        return members.stream()
                .map(m -> MemberResponse.of(m, userMap.get(m.getUserId())))
                .collect(Collectors.toList());
    }

    /** 멤버 초대 (OWNER 전용) */
    @Transactional
    public MemberResponse inviteMember(Long accountBookId, MemberInviteRequest request, String requesterEmail) {
        Long requesterId = resolveUserId(requesterEmail);
        if (!memberService.isOwner(accountBookId, requesterId)) {
            throw new IllegalArgumentException("가계부 소유자만 멤버를 초대할 수 있습니다.");
        }
        if (request.getAuthority() == Authority.OWNER) {
            throw new IllegalArgumentException("OWNER 권한으로 초대할 수 없습니다.");
        }

        // 초대 대상 유저 조회
        UserDto invitee = ExternalResponseValidator.requireData(
                userServiceClient.getUser(request.getEmail()), "user-service");

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

    /** 멤버 권한 변경 (OWNER 전용, OWNER 변경 불가) */
    @Transactional
    public MemberResponse updateAuthority(Long accountBookId, Long targetUserId,
                                          MemberAuthorityUpdateRequest request, String requesterEmail) {
        Long requesterId = resolveUserId(requesterEmail);
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
        UserDto user = fetchSingleUser(targetUserId);
        return MemberResponse.of(updated, user);
    }

    /** 멤버 삭제 (OWNER 전용, 자기 자신 삭제 불가) */
    @Transactional
    public void removeMember(Long accountBookId, Long targetUserId, String requesterEmail) {
        Long requesterId = resolveUserId(requesterEmail);
        if (!memberService.isOwner(accountBookId, requesterId)) {
            throw new IllegalArgumentException("가계부 소유자만 멤버를 삭제할 수 있습니다.");
        }
        if (targetUserId.equals(requesterId)) {
            throw new IllegalArgumentException("본인은 삭제할 수 없습니다.");
        }

        memberService.removeMember(accountBookId, targetUserId);
        log.info("멤버 삭제: accountBookId={}, removedUserId={}", accountBookId, targetUserId);
    }

    // ── 내부 헬퍼 ────────────────────────────────────────────────────────────

    private Long resolveUserId(String email) {
        UserDto user = ExternalResponseValidator.requireData(userServiceClient.getUser(email), "user-service");
        return ExternalResponseValidator.requireField(user, UserDto::getId, "user-service", "user id");
    }

    private Map<Long, UserDto> fetchUsers(List<Long> userIds) {
        if (userIds.isEmpty()) return Map.of();
        try {
            List<UserDto> users = ExternalResponseValidator.requireData(
                    userServiceClient.getUsersByIds(userIds), "user-service");
            return users.stream()
                    .filter(Objects::nonNull)
                    .filter(u -> u.getId() != null)
                    .collect(Collectors.toMap(UserDto::getId, u -> u));
        } catch (Exception e) {
            log.warn("유저 배치 조회 실패: {}", e.getMessage());
            return Map.of();
        }
    }

    private UserDto fetchSingleUser(Long userId) {
        Map<Long, UserDto> map = fetchUsers(List.of(userId));
        return map.get(userId);
    }
}
