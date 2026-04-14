# Internal API Security

## 목적

내부 서비스 간 호출용 `/internal/**` 엔드포인트를 외부 공개 API와 명확히 분리하고,
Gateway 및 서비스 레벨에서 일관된 인증 정책을 적용한다.

## 현재 정책

- 외부 공개 API는 `/api/**` 경로만 사용한다.
- 내부 서비스 전용 API는 `/internal/**` 경로만 사용한다.
- Gateway는 `/internal/**` 경로를 외부로 라우팅하지 않고 `404`로 차단한다.
- `/internal/**` 요청은 `common-module`의 `InternalRequestFilter`에서 검증한다.
- 내부 호출은 Feign + `InternalServiceFeignInterceptor`로만 수행한다.

## 필수 헤더

- `X-Internal-Service`
  - 호출 서비스 이름
- `X-Internal-Token`
  - 환경변수 `INTERNAL_SERVICE_TOKEN`에서 주입된 공통 내부 토큰
- `X-Correlation-Id`
  - 선택 헤더
  - 추적 편의를 위해 전달

## 환경 변수

- `INTERNAL_SERVICE_TOKEN`은 모든 백엔드 서비스에서 동일한 값으로 설정해야 한다.
- 기본값 fallback은 사용하지 않는다.
- 로컬, Docker, 운영 환경 모두 배포 시점에 명시적으로 주입한다.

## Gateway 정책

- 인증이 필요한 `/api/**` 경로는 Gateway에서 JWT를 검사한다.
- 인증 실패 응답은 공통 JSON 형식으로 반환한다.
- `/internal/**`는 Gateway를 통해 접근할 수 없다.

## 서비스 정책

- `/internal/**`는 Spring Security permit 대상이어도, 실제 접근은 `InternalRequestFilter`가 차단한다.
- 내부 API는 프론트엔드에서 직접 호출하지 않는다.
- 서비스 간 직접 호출은 Feign 클라이언트로만 구현한다.

## 운영 체크리스트

1. 모든 서비스에 `INTERNAL_SERVICE_TOKEN`이 동일하게 설정되어 있는지 확인한다.
2. Gateway 외부 노출 대상에 개별 서비스 포트를 포함하지 않는다.
3. 신규 내부 API는 `/internal/**` 아래에만 추가한다.
4. 신규 Feign 클라이언트가 공통 interceptor를 사용하도록 유지한다.
5. `/internal/**` 경로를 Gateway 라우트에 추가하지 않는다.
