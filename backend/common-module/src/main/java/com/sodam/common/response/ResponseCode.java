package com.sodam.common.response;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ResponseCode {
    // 성공
    SUCCESS("S-00000", "요청이 성공적으로 처리되었습니다."),

    // 클라이언트 오류
    BAD_REQUEST("E-00001", "잘못된 요청입니다."),
    UNAUTHORIZED("E-00002", "인증 정보가 유효하지 않습니다."),
    FORBIDDEN("E-00003", "접근 권한이 없습니다."),
    NOT_FOUND("E-00004", "요청한 리소스를 찾을 수 없습니다."),
    METHOD_NOT_ALLOWED("E-00005", "허용되지 않은 HTTP 메서드입니다."),

    // 서버 오류
    INTERNAL_SERVER_ERROR("E-00000", "서버에 오류가 발생했습니다.");

    private final String code;
    private final String message;
}
