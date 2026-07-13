# 내부 API 가이드

## 목적

이 문서는 `backend` Spring Cloud MSA에서 서비스 간 내부 호출 API 규칙을 정의합니다.

내부 API는 백엔드 서비스 간 통신을 위한 용도이며, 프런트엔드나 외부 클라이언트에 공개하는 API가 아닙니다.

## 경로 규칙

- 외부 공개 API는 반드시 `/api/**` 를 사용합니다.
- 내부 서비스 전용 API는 반드시 `/internal/**` 를 사용합니다.
- 게이트웨이는 외부 공개 API만 라우팅합니다.
- 내부 API는 게이트웨이를 통하지 않고 서비스 디스커버리와 Feign을 통해 직접 호출합니다.

## 현재 내부 API 목록

- `user-service`
  - `GET /internal/users/{email}`
  - 용도: 다른 서비스에서 사용자 정보를 조회할 때 사용

- `category-service`
  - `GET /internal/categories?ids=1,2,3`
  - 용도: 다른 서비스에서 카테고리 목록을 일괄 조회할 때 사용

- `account-book-service`
  - `POST /internal/account-books`
  - 용도: 회원가입 같은 내부 워크플로우에서 가계부를 생성할 때 사용

## 외부 API와 내부 API 구분 기준

- 아래 조건에 해당하면 `외부 공개 API`로 만듭니다.
  - 요청 주체가 프런트엔드 또는 외부 클라이언트인 경우
  - 최종 인증 주체가 사용자 액세스 토큰인 경우
  - 응답 형식이 외부 계약으로 유지되어야 하는 경우

- 아래 조건에 해당하면 `내부 API`로 만듭니다.
  - 호출 주체가 다른 백엔드 서비스인 경우
  - 게이트웨이에 노출할 필요가 없는 경우
  - 서비스 간 조회, 보조 처리, 내부 오케스트레이션을 위한 경우

## 보안 규칙

모든 `/internal/**` 엔드포인트는 `common-module`의 공통 내부 호출 보안 컴포넌트로 보호해야 합니다.

### 필수 헤더

- `X-Internal-Service`
  - 호출하는 서비스 이름

- `X-Internal-Token`
  - 서비스 간 공통 내부 인증 토큰

- `X-Correlation-Id`
  - 선택 헤더
  - 상위 요청에서 전달된 correlation id
  - 없으면 수신 서비스에서 생성될 수 있음

## 공통 보안 컴포넌트

다음 컴포넌트는 `common-module`에서 공통 제공됩니다.

- [HeaderNames.java](/C:/Users/jungu/Desktop/project/sodam/backend/common-module/src/main/java/com/sodam/common/security/HeaderNames.java)
  - 내부 호출 관련 공통 헤더 상수 정의

- [InternalServiceFeignInterceptor.java](/C:/Users/jungu/Desktop/project/sodam/backend/common-module/src/main/java/com/sodam/common/security/InternalServiceFeignInterceptor.java)
  - Feign 내부 호출 시 서비스명, 내부 토큰, trace/correlation 헤더를 자동 추가

- [InternalRequestFilter.java](/C:/Users/jungu/Desktop/project/sodam/backend/common-module/src/main/java/com/sodam/common/security/InternalRequestFilter.java)
  - `/internal/**` 요청의 내부 헤더와 토큰을 검증

- [CommonInternalServiceAutoConfiguration.java](/C:/Users/jungu/Desktop/project/sodam/backend/common-module/src/main/java/com/sodam/common/config/CommonInternalServiceAutoConfiguration.java)
  - 내부 요청 검증 필터를 자동 등록

## 구현 체크리스트

새로운 내부 API를 추가할 때는 아래 순서를 따릅니다.

1. 엔드포인트 경로를 `/internal/**` 아래에 정의합니다.
2. 게이트웨이 라우팅 대상에 포함하지 않습니다.
3. 서비스 간 호출은 Feign을 사용합니다.
4. 사용자 토큰 대신 공통 내부 헤더 규약을 사용합니다.
5. 요청/응답 계약은 내부 용도에 맞게 최소한으로 유지합니다.
6. 추가한 내부 API를 이 문서에 함께 기록합니다.

## 지양해야 할 사항

- 내부 전용 용도인데 `/api/**` 경로로 서비스 간 호출하지 않습니다.
- `/internal/**` 엔드포인트를 프런트엔드에 직접 노출하지 않습니다.
- 서비스마다 내부 인증 로직을 중복 구현하지 않습니다.
- 공통 Feign 인터셉터가 있는데도 각 클라이언트에서 내부 헤더를 직접 하드코딩하지 않습니다.
