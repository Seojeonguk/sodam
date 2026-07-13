# Sodam API 명세서

## 문서 목적

이 문서는 현재 백엔드 코드에 설계 및 구현된 API를 기준으로 작성한 API 산출물이다. 게이트웨이를 통해 외부에 노출되는 공개 API와 서비스 간 통신에 사용하는 내부 API를 구분하고, 각 API의 요청/응답 DTO와 인증 규칙을 함께 정리한다.

## 시스템 구성

| 구성 요소 | 포트 | 역할 |
| --- | ---: | --- |
| `gateway-service` | 10003 | 외부 요청 진입점, JWT 인증 필터, 서비스 라우팅 |
| `user-service` | 10002 | 회원가입, 로그인, 토큰 재발급, 사용자 조회 |
| `transaction-service` | 10001 | 거래 내역 CRUD, 거래 통계 |
| `category-service` | 10004 | 카테고리, 분류 조회 및 관리 |
| `account-book-service` | 10005 | 가계부 조회 및 관리 |
| `eureka-server` | 8761 | 서비스 디스커버리 |
| `MariaDB` | 3310 | 서비스 데이터 저장소 |

외부 클라이언트는 원칙적으로 `gateway-service`의 `/api/**` 경로만 호출한다. `/internal/**` 경로는 서비스 간 Feign 호출용이며 게이트웨이에서 `404 NOT_FOUND`로 차단된다.

## 공통 규칙

### Base URL

| 환경 | URL |
| --- | --- |
| Local Gateway | `http://localhost:10003` |

### 공통 응답

공개 API는 기본적으로 `ApiResponse<T>` 형식을 사용한다.

```json
{
  "code": "S-00000",
  "message": "성공",
  "data": {}
}
```

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `code` | `String` | 응답 코드. 성공 시 `S-00000` |
| `message` | `String` | 응답 메시지 |
| `data` | `T` | API별 응답 데이터. 삭제 API 등은 `null` 가능 |

### 공통 에러 코드

| HTTP Status | Code | 의미 |
| ---: | --- | --- |
| 400 | `E-00001` | 잘못된 요청 |
| 401 | `E-00002` | 인증 정보 없음 또는 유효하지 않음 |
| 403 | `E-00003` | 접근 권한 없음 |
| 404 | `E-00004` | 리소스 없음 |
| 405 | `E-00005` | 허용되지 않은 HTTP 메서드 |
| 502 | `E-00006` | 외부 또는 내부 서비스 호출 실패 |
| 500 | `E-00000` | 서버 오류 |

### 인증

게이트웨이 라우팅 기준으로 다음 API는 JWT 인증 없이 접근 가능하다.

| Method | Path |
| --- | --- |
| `POST` | `/api/auth/login` |
| `POST` | `/api/auth/logout` |
| `POST` | `/api/auth/register` |
| `POST` | `/api/auth/reissue` |
| `GET` | `/oauth2/authorization/**` |
| `GET` | `/login/oauth2/**` |

그 외 `/api/auth/**`, `/api/transactions/**`, `/api/stat/**`, `/api/categories/**`, `/api/classifications/**`, `/api/account-books/**` 요청은 게이트웨이의 JWT 인증 필터를 거친다.

인증이 필요한 요청은 다음 헤더를 사용한다.

| Header | 설명 |
| --- | --- |
| `Authorization: Bearer {accessToken}` | 액세스 토큰 |

## 공개 API 목록

### Auth API

| Method | Path | 인증 | 설명 |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | 불필요 | 회원가입 |
| `POST` | `/api/auth/login` | 불필요 | 로그인 |
| `POST` | `/api/auth/logout` | 불필요 | 로그아웃 |
| `POST` | `/api/auth/reissue` | 불필요 | Refresh token 기반 토큰 재발급 |
| `GET` | `/api/auth/refresh?userId={userId}` | 필요 | 사용자 ID 기반 토큰 재발급 |

#### POST `/api/auth/register`

요청 본문: `RegisterRequest`

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `email` | `String` | 예 | 이메일 |
| `password` | `String` | 예 | 비밀번호 |
| `name` | `String` | 예 | 사용자 이름 |

응답: `ApiResponse<String>`

#### POST `/api/auth/login`

요청 본문: `LoginRequest`

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `email` | `String` | 예 | 이메일 |
| `password` | `String` | 예 | 비밀번호 |

응답 데이터: `LoginResponse`

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `accessToken` | `String` | JWT 액세스 토큰 |

#### POST `/api/auth/reissue`

요청: HTTP 요청에 포함된 refresh token 정보를 서비스에서 읽어 처리한다.

응답 데이터: `LoginResponse`

실패 시 `code`는 `E-00002`, `message`는 refresh token이 유효하지 않다는 의미의 메시지를 반환한다.

### Account Book API

| Method | Path | 인증 | 설명 |
| --- | --- | --- | --- |
| `GET` | `/api/account-books` | 필요 | 내 가계부 목록 조회 |
| `POST` | `/api/account-books` | 필요 | 가계부 생성 |
| `GET` | `/api/account-books/{id}` | 필요 | 가계부 단건 조회 |
| `PUT` | `/api/account-books/{id}` | 필요 | 가계부 수정 |
| `DELETE` | `/api/account-books/{id}` | 필요 | 가계부 삭제 |

#### AccountBookCreateRequest

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `name` | `String` | 가계부 이름 |
| `userId` | `Long` | 사용자 ID. 공개 API에서는 인증 사용자 기준 처리와 함께 사용 |

#### AccountBookUpdateRequest

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `name` | `String` | 변경할 가계부 이름 |
| `userId` | `Long` | 사용자 ID |

#### AccountBookResponse

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `id` | `Long` | 가계부 ID |
| `name` | `String` | 가계부 이름 |
| `updatedAt` | `String` | 수정 일시 |

#### AccountBookListResponse

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `id` | `Long` | 가계부 ID |
| `name` | `String` | 가계부 이름 |
| `isOwner` | `Integer` | 소유자 여부 |
| `canEdit` | `Integer` | 수정 권한 여부 |

### Category API

| Method | Path | 인증 | 설명 |
| --- | --- | --- | --- |
| `POST` | `/api/categories` | 필요 | 카테고리 생성 |
| `GET` | `/api/categories` | 필요 | 카테고리 목록 조회 |
| `GET` | `/api/categories/{id}` | 필요 | 카테고리 단건 조회 |
| `PUT` | `/api/categories/{id}` | 필요 | 카테고리 수정 |
| `DELETE` | `/api/categories/{id}` | 필요 | 카테고리 삭제 |

#### GET `/api/categories`

쿼리 파라미터는 `CategoryListRequest`와 Spring `Pageable`을 함께 사용한다.

| 파라미터 | 타입 | 설명 |
| --- | --- | --- |
| `page` | `Integer` | 페이지 번호 |
| `limit` | `Integer` | 페이지 크기 |
| `userSeq` | `Long` | 사용자 식별자 |
| `size` | `Integer` | Spring Pageable 페이지 크기 |
| `sort` | `String` | Spring Pageable 정렬 조건 |

#### CategoryCreateRequest

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `name` | `String` | 카테고리 이름 |
| `description` | `String` | 설명 |
| `color` | `String` | 표시 색상 |
| `userSeq` | `Long` | 사용자 식별자 |

#### CategoryUpdateRequest

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `name` | `String` | 카테고리 이름 |
| `description` | `String` | 설명 |
| `color` | `String` | 표시 색상 |

#### CategoryDeleteRequest

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `replaceCategoryId` | `Long` | 삭제 대상 카테고리를 대체할 카테고리 ID |

#### CategoryResponse

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `name` | `String` | 카테고리 이름 |
| `description` | `String` | 설명 |
| `color` | `String` | 표시 색상 |

#### CategoryListResponse

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `categories` | `List<CategoryListItemResponse>` | 카테고리 목록 |
| `pageNumber` | `Integer` | 현재 페이지 번호 |
| `pageSize` | `Integer` | 페이지 크기 |
| `totalElements` | `Long` | 전체 요소 수 |
| `totalPages` | `Integer` | 전체 페이지 수 |

#### CategoryListItemResponse

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `id` | `Long` | 카테고리 ID |
| `name` | `String` | 카테고리 이름 |
| `description` | `String` | 설명 |
| `color` | `String` | 표시 색상 |

### Classification API

| Method | Path | 인증 | 설명 |
| --- | --- | --- | --- |
| `GET` | `/api/classifications?accountBookSeq={accountBookSeq}` | 필요 | 가계부별 분류 목록 조회 |

#### ClassificationResponse

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `id` | `Long` | 분류 ID |
| `name` | `String` | 분류 이름 |

### Transaction API

| Method | Path | 인증 | 설명 |
| --- | --- | --- | --- |
| `POST` | `/api/transactions` | 필요 | 거래 생성 |
| `GET` | `/api/transactions` | 필요 | 거래 목록 조회 |
| `GET` | `/api/transactions/{id}` | 필요 | 거래 단건 조회 |
| `PUT` | `/api/transactions/{id}` | 필요 | 거래 수정 |
| `DELETE` | `/api/transactions/{id}` | 필요 | 거래 삭제 |
| `PUT` | `/api/transactions/category/move` | 필요 | 기존 카테고리 거래를 새 카테고리로 이동 |

#### TransactionRequest

| 필드 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| `accountBookSeq` | `Long` | 아니오 | - | 가계부 식별자 |
| `userSeq` | `Long` | 아니오 | - | 사용자 식별자 |
| `categorySeq` | `Long` | 아니오 | - | 카테고리 식별자 |
| `amount` | `BigDecimal` | 예 | `@NotNull` | 거래 금액 |
| `description` | `String` | 아니오 | 최대 255자 | 설명 |
| `transactionDate` | `String` | 예 | `@NotNull` | 거래 발생일 |
| `type` | `TransactionType` | 예 | `@NotNull`, `INCOME` 또는 `EXPENSE` | 거래 유형 |
| `satisfactionRating` | `Integer` | 아니오 | 1 이상 5 이하 | 만족도 |

#### GET `/api/transactions`

쿼리 파라미터는 `TransactionSearchRequest`와 Spring `Pageable`을 함께 사용한다.

| 파라미터 | 타입 | 설명 |
| --- | --- | --- |
| `userId` | `Long` | 사용자 ID |
| `accountBookSeq` | `Long` | 가계부 식별자 |
| `startDate` | `String` | 조회 시작일 |
| `endDate` | `String` | 조회 종료일 |
| `page` | `Integer` | Spring Pageable 페이지 번호 |
| `size` | `Integer` | Spring Pageable 페이지 크기 |
| `sort` | `String` | Spring Pageable 정렬 조건 |

#### PUT `/api/transactions/category/move`

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `oldCategoryId` | `Long` | 예 | 기존 카테고리 ID |
| `newCategoryId` | `Long` | 예 | 새 카테고리 ID |

응답 데이터: 이동 처리된 거래 수를 나타내는 `Integer`

#### TransactionResponse

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `seq` | `Long` | 거래 ID |
| `accountBookSeq` | `Long` | 가계부 식별자 |
| `userSeq` | `Long` | 사용자 식별자 |
| `categorySeq` | `Long` | 카테고리 식별자 |
| `amount` | `BigDecimal` | 거래 금액 |
| `description` | `String` | 설명 |
| `transactionDate` | `String` | 거래 발생일 |
| `type` | `TransactionType` | 거래 유형 |
| `satisfactionRating` | `Integer` | 만족도 |
| `createdAt` | `String` | 생성 일시 |
| `updatedAt` | `String` | 수정 일시 |

#### TransactionListResponse

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `transactions` | `List<TransactionListItemResponse>` | 거래 목록 |
| `pageNumber` | `int` | 현재 페이지 번호 |
| `pageSize` | `int` | 페이지 크기 |
| `totalElements` | `long` | 전체 요소 수 |
| `totalPages` | `int` | 전체 페이지 수 |

#### TransactionListItemResponse

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `seq` | `Long` | 거래 ID |
| `amount` | `BigDecimal` | 거래 금액 |
| `description` | `String` | 설명 |
| `transactionDate` | `String` | 거래 발생일 |
| `type` | `TransactionType` | 거래 유형 |
| `categoryName` | `String` | 카테고리 이름 |

### Stat API

| Method | Path | 인증 | 설명 |
| --- | --- | --- | --- |
| `GET` | `/api/stat` | 필요 | 유형/카테고리 기준 통계 조회 |
| `GET` | `/api/stat/period` | 필요 | 기간별 통계 조회 |

#### GET `/api/stat`

| 파라미터 | 타입 | 설명 |
| --- | --- | --- |
| `userSeq` | `Long` | 사용자 식별자 |
| `startDate` | `String` | 조회 시작일 |
| `endDate` | `String` | 조회 종료일 |

응답 데이터: `List<StatResponse>`

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `total` | `Double` | 합계 |
| `type` | `String` | 거래 유형 |
| `name` | `String` | 통계 기준 이름 |

#### GET `/api/stat/period`

| 파라미터 | 타입 | 설명 |
| --- | --- | --- |
| `startDate` | `String` | 조회 시작일 |
| `endDate` | `String` | 조회 종료일 |
| `userSeq` | `Long` | 사용자 식별자 |

응답 데이터: `List<StatPeriodResponse>`

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `total` | `Double` | 합계 |
| `type` | `String` | 거래 유형 |
| `transaction_date` | `String` | 거래 일자 |

## 내부 API 목록

내부 API는 서비스 간 호출 전용이다. 직접 외부에 공개하지 않으며, `/internal/**` 요청은 게이트웨이에서 차단된다.

내부 API 요청에는 공통 보안 헤더를 사용한다.

| Header | 필수 | 설명 |
| --- | --- | --- |
| `X-Internal-Service` | 예 | 호출한 서비스 이름 |
| `X-Internal-Token` | 예 | 서비스 간 공유 내부 토큰 |
| `X-Correlation-Id` | 아니오 | 추적용 correlation id |

| Service | Method | Path | 응답 | 용도 |
| --- | --- | --- | --- | --- |
| `user-service` | `GET` | `/internal/users/{email}` | `ApiResponse<UserResponse>` | 이메일 기준 사용자 조회 |
| `category-service` | `GET` | `/internal/categories?ids=1,2,3` | `List<CategoryListItemResponse>` | ID 목록 기준 카테고리 조회 |
| `category-service` | `POST` | `/internal/classifications` | `ApiResponse<ClassificationResponse>` | 기본 분류 생성 |
| `account-book-service` | `POST` | `/internal/account-books` | `AccountBookResponse` | 기본 가계부 생성 |

### Internal DTO

#### UserResponse

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `id` | `Long` | 사용자 ID |
| `email` | `String` | 이메일 |
| `name` | `String` | 이름 |
| `imageUrl` | `String` | 프로필 이미지 URL |

#### ClassificationCreateRequest

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `name` | `String` | 분류 이름 |
| `accountBookSeq` | `Long` | 가계부 식별자 |

## 라우팅 요약

| Gateway Route | 대상 서비스 | 인증 필터 |
| --- | --- | --- |
| `/api/auth/login`, `/api/auth/logout`, `/api/auth/register`, `/api/auth/reissue` | `user-service` | 없음 |
| `/api/auth/**` | `user-service` | 적용 |
| `/api/transactions/**`, `/api/stat/**` | `transaction-service` | 적용 |
| `/api/categories/**`, `/api/classifications/**` | `category-service` | 적용 |
| `/api/account-books/**` | `account-book-service` | 적용 |
| `/internal/**` | 차단 | `404 NOT_FOUND` |

## 구현 기준 파일

이 문서는 다음 구현 파일을 기준으로 작성했다.

| 영역 | 파일 |
| --- | --- |
| 게이트웨이 라우팅 | `backend/gateway-service/src/main/java/com/sodam/gatewayservice/config/RouteConfig.java` |
| 공통 응답 | `backend/common-module/src/main/java/com/sodam/common/response/ApiResponse.java` |
| 공통 에러 코드 | `backend/common-module/src/main/java/com/sodam/common/response/ResponseCode.java` |
| Auth API | `backend/user-service/src/main/java/com/sodam/userservice/application/api/controller/AuthController.java` |
| Account Book API | `backend/account-book-service/src/main/java/com/sodam/accountbookservice/application/api/contoller/AccountBookController.java` |
| Category API | `backend/category-service/src/main/java/com/example/categoryservice/application/api/controller/CategoryController.java` |
| Classification API | `backend/category-service/src/main/java/com/example/categoryservice/application/api/controller/ClassificationController.java` |
| Transaction API | `backend/transaction-service/src/main/java/com/sodam/transactionservice/application/api/controller/TransactionController.java` |
| Stat API | `backend/transaction-service/src/main/java/com/sodam/transactionservice/application/api/controller/StatController.java` |
