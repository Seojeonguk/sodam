package com.sodam.common.response;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ResponseCode {
    SUCCESS(200, "S-00000", "요청이 성공적으로 처리되었습니다."),

    BAD_REQUEST(400, "E-00001", "잘못된 요청입니다."),
    UNAUTHORIZED(401, "E-00002", "인증 정보가 유효하지 않습니다."),
    FORBIDDEN(403, "E-00003", "접근 권한이 없습니다."),
    NOT_FOUND(404, "E-00004", "요청한 리소스를 찾을 수 없습니다."),
    METHOD_NOT_ALLOWED(405, "E-00005", "허용되지 않은 HTTP 메서드입니다."),

    BAD_GATEWAY(502, "E-00006", "외부 서비스 호출 중 오류가 발생했습니다."),
    INTERNAL_SERVER_ERROR(500, "E-00000", "서버 오류가 발생했습니다.");

    private final Integer status;
    private final String code;
    private final String message;
}
