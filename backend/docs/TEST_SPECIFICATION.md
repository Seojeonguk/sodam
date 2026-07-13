# Sodam 테스트 명세서

## 문서 목적

이 문서는 현재 백엔드 테스트 구조와 기능별 검증 범위를 정리한다. 테스트 추가 또는 회귀 검증 시 기준 문서로 사용한다.

## 테스트 전략

| 계층 | 목적 | 예시 |
| --- | --- | --- |
| Controller Test | HTTP 요청/응답, validation, 예외 처리 검증 | `*ControllerTest`, `*ExceptionHandlingTest` |
| Application Service Test | 유스케이스 조립, 외부 서비스 client 연동, 트랜잭션 흐름 검증 | `*ApplicationServiceTest` |
| Domain Service Test | 도메인 생성/수정/삭제 규칙 검증 | `*ServiceTest`, `*DomainServiceTest` |
| Repository Test | JPA query, specification, DB mapping 검증 | `*RepositoryDataJpaTest` |
| Container Test | MariaDB 기반 실제 DB 동작 검증 | `*MariaDbContainerTest` |
| Common Module Test | 공통 예외, 응답, 보안 필터, Feign 에러 처리 검증 | `common-module/src/test` |
| Gateway Test | JWT 필터 및 토큰 유틸 검증 | `gateway-service/src/test` |

## 서비스별 테스트 현황

### user-service

| 테스트 파일 | 검증 범위 |
| --- | --- |
| `AuthControllerTest` | 로그인, 로그아웃, 회원가입, 토큰 재발급 API |
| `UserApplicationServiceTest` | 회원가입/로그인/재발급 유스케이스 |
| `JwtTokenProviderTest` | JWT 생성 및 검증 |
| `UserSecurityConfigIntegrationTest` | Spring Security 설정 |
| `OAuthAttributesTest` | OAuth 사용자 속성 매핑 |
| `OAuth2SuccessHandlerTest` | OAuth 성공 처리 |
| `UserRepositoryDataJpaTest` | 사용자 repository 동작 |
| `UserServiceImplTest` | 사용자 등록/조회/수정/삭제 도메인 서비스 |

### account-book-service

| 테스트 파일 | 검증 범위 |
| --- | --- |
| `AccountBookControllerTest` | 가계부 공개 API |
| `AccountBookControllerExceptionHandlingTest` | 가계부 API 예외 응답 |
| `AccountBookApplicationServiceTest` | 사용자 ID 해석, 가계부/멤버 생성 흐름 |
| `AccountBookServiceTest` | 가계부 생성/수정/삭제 도메인 규칙 |
| `AccountBookMemberServiceTest` | 가계부 멤버 저장 |
| `AccountBookRepositoryDataJpaTest` | 접근 가능한 가계부 조회 query |
| `AccountBookRepositoryMariaDbContainerTest` | MariaDB 기반 repository 검증 |

### category-service

| 테스트 파일 | 검증 범위 |
| --- | --- |
| `CategoryControllerTest` | 카테고리 공개 API |
| `CategoryControllerExceptionHandlingTest` | 카테고리 예외 응답 |
| `ClassificationControllerTest` | 분류 조회 API |
| `ClassificationInternalControllerTest` | 분류 내부 생성 API |
| `CategoryApplicationServiceTest` | 사용자 ID 해석, 카테고리 삭제 시 거래 이동 호출 |
| `ClassificationInternalServiceTest` | 분류 생성/조회 유스케이스 |
| `CategoryServiceTest` | 카테고리 소유자 검증 및 CRUD |
| `ClassificationServiceTest` | 분류 생성/조회 |
| `CategoryRepositoryDataJpaTest` | 카테고리 repository/specification |

### transaction-service

| 테스트 파일 | 검증 범위 |
| --- | --- |
| `TransactionControllerTest` | 거래 공개 API |
| `TransactionControllerExceptionHandlingTest` | 거래 API 예외 응답 |
| `TransactionControllerValidationTest` | 거래 요청 validation |
| `TransactionApplicationServiceTest` | 사용자 ID 해석, 카테고리명 보강, 카테고리 이동 |
| `TransactionDomainServiceTest` | 거래 CRUD 및 조건 검색 |
| `TransactionTest` | 거래 도메인 모델 |
| `TransactionRepositoryDataJpaTest` | 거래 repository/specification |
| `TransactionRepositoryMariaDbContainerTest` | MariaDB 기반 repository 검증 |
| `StatControllerTest` | 통계 API |
| `StatApplicationServiceTest` | 통계 유스케이스 |
| `StatDomainServiceTest` | MyBatis mapper 호출 |

### common-module

| 테스트 파일 | 검증 범위 |
| --- | --- |
| `CommonFeignErrorDecoderTest` | Feign 에러 변환 |
| `GlobalExceptionHandlerTest` | 공통 예외 응답 |
| `ExternalResponseValidatorTest` | 외부 응답 data/field 검증 |
| `InternalRequestFilterTest` | 내부 API 헤더/토큰 검증 |
| `UserContextArgumentResolverTest` | 인증 사용자 컨텍스트 주입 |

### gateway-service

| 테스트 파일 | 검증 범위 |
| --- | --- |
| `JwtAuthGatewayFilterTest` | Gateway JWT 인증 필터 |
| `JwtUtilTest` | Gateway JWT 유틸 |

## 핵심 시나리오 테스트 목록

### 회원

| ID | 시나리오 | 기대 결과 |
| --- | --- | --- |
| T-USER-001 | 신규 이메일로 회원가입 | 사용자 저장, 기본 가계부 생성 호출, 기본 분류 생성 호출 |
| T-USER-002 | 중복 이메일 회원가입 | 실패 |
| T-USER-003 | 올바른 비밀번호 로그인 | access token 반환, refresh token 쿠키 설정 |
| T-USER-004 | 잘못된 비밀번호 로그인 | 실패 |
| T-USER-005 | 유효한 refresh token 재발급 | 새 access token 반환 |
| T-USER-006 | refresh token 없음/무효 | 인증 실패 응답 |

### 가계부

| ID | 시나리오 | 기대 결과 |
| --- | --- | --- |
| T-BOOK-001 | 가계부 생성 | 가계부 저장, OWNER 멤버 생성 |
| T-BOOK-002 | 접근 가능한 가계부 목록 조회 | 사용자 ID 기준 목록 반환 |
| T-BOOK-003 | 존재하지 않는 가계부 수정 | 실패 |
| T-BOOK-004 | 존재하지 않는 가계부 삭제 | 실패 |

### 거래

| ID | 시나리오 | 기대 결과 |
| --- | --- | --- |
| T-TX-001 | 유효한 거래 생성 | 거래 저장 |
| T-TX-002 | 금액 누락 | validation 실패 |
| T-TX-003 | 거래일 누락 | validation 실패 |
| T-TX-004 | 유형 누락 | validation 실패 |
| T-TX-005 | 만족도 1 미만 또는 5 초과 | validation 실패 |
| T-TX-006 | 조건별 목록 조회 | 사용자/가계부/기간 조건 반영, 날짜 내림차순 |
| T-TX-007 | 카테고리명 보강 | 카테고리 service 응답 기반 categoryName 포함 |
| T-TX-008 | 카테고리 이동 | oldCategoryId 거래가 newCategoryId로 변경 |

### 카테고리/분류

| ID | 시나리오 | 기대 결과 |
| --- | --- | --- |
| T-CAT-001 | 카테고리 생성 | 인증 사용자 ID로 저장 |
| T-CAT-002 | 소유자 카테고리 수정 | 수정 성공 |
| T-CAT-003 | 다른 사용자 카테고리 수정 | 실패 |
| T-CAT-004 | 카테고리 삭제 | 거래 이동 호출 후 삭제 |
| T-CLS-001 | accountBookSeq로 분류 조회 | 해당 가계부 분류 목록 반환 |
| T-CLS-002 | accountBookSeq 없이 분류 생성/조회 | 실패 |

### 통계

| ID | 시나리오 | 기대 결과 |
| --- | --- | --- |
| T-STAT-001 | 기간별 유형/카테고리 통계 조회 | 합계 목록 반환 |
| T-STAT-002 | 기간별 추이 조회 | 거래일 기준 통계 목록 반환 |

## 실행 명령

백엔드 전체 또는 일부 모듈 테스트는 Gradle로 실행한다.

```powershell
cd backend
.\gradlew.bat test
```

특정 모듈 테스트:

```powershell
.\gradlew.bat :user-service:test
.\gradlew.bat :transaction-service:test
.\gradlew.bat :category-service:test
.\gradlew.bat :account-book-service:test
.\gradlew.bat :common-module:test
.\gradlew.bat :gateway-service:test
```

프론트엔드 정적 검증:

```powershell
cd frontend
npm run lint
npm run build
```

## 테스트 추가 기준

| 변경 유형 | 권장 테스트 |
| --- | --- |
| Controller 경로/DTO 변경 | Controller Test, Validation Test |
| 유스케이스 흐름 변경 | Application Service Test |
| 도메인 규칙 변경 | Domain Service Test |
| Repository query 변경 | DataJpaTest, 필요 시 MariaDB Container Test |
| 공통 응답/예외 변경 | common-module 테스트 |
| Gateway 인증/라우팅 변경 | gateway-service 테스트 |
| 화면 API 연동 변경 | 프론트엔드 build/lint 및 수동 시나리오 확인 |

## 테스트 리스크

| 항목 | 설명 |
| --- | --- |
| 서비스 간 통합 | 개별 서비스 테스트는 많지만 전체 MSA 플로우 E2E 테스트는 별도 정의가 필요하다. |
| 권한 검증 | 거래 단건/가계부 수정 삭제 권한 검증 테스트는 현재 구현 보강과 함께 추가 검토가 필요하다. |
| 프론트엔드 자동화 | 현재 문서 기준 프론트엔드 단위/E2E 테스트 도구는 확인되지 않았다. |
