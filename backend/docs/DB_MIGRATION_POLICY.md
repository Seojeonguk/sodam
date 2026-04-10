# DB Migration Policy

## 목적

이 문서는 `backend` 프로젝트의 데이터베이스 스키마 변경 정책을 정의한다.
이후 테이블/컬럼/인덱스 변경은 애플리케이션 실행 시 자동 반영하지 않고, 반드시 migration 파일로 관리한다.

## 기본 원칙

- JPA의 `ddl-auto: update`는 사용하지 않는다.
- JPA는 `validate`로만 동작하며, 애플리케이션 시작 시 엔티티와 스키마 일치 여부만 검증한다.
- 모든 스키마 변경은 Flyway migration 파일로 반영한다.
- 운영 DB에 수동으로 테이블/컬럼을 추가하거나 수정하지 않는다.
- 서비스별로 Flyway 히스토리 테이블을 분리해 같은 MariaDB를 공유하더라도 충돌하지 않게 한다.

## 적용 대상

현재 Flyway가 적용된 서비스는 다음과 같다.

- `user-service`
- `transaction-service`
- `category-service`
- `account-book-service`

각 서비스는 자신의 `db/migration` 경로만 관리한다.

## 디렉터리 규칙

- `user-service/src/main/resources/db/migration`
- `transaction-service/src/main/resources/db/migration`
- `category-service/src/main/resources/db/migration`
- `account-book-service/src/main/resources/db/migration`

## 파일 규칙

Flyway 파일명 규칙:

- `V1__init_user_service.sql`
- `V2__add_user_profile_index.sql`
- `V3__alter_category_color_length.sql`

규칙:

- 버전은 증가하는 정수로 관리한다.
- 설명은 소문자와 언더스코어 중심으로 작성한다.
- 하나의 migration은 하나의 의도를 가지도록 작게 유지한다.

## 변경 절차

테이블/컬럼 변경이 필요할 때는 아래 순서를 따른다.

1. 엔티티 변경 사항을 먼저 설계한다.
2. 해당 서비스의 migration SQL 파일을 추가한다.
3. 로컬 DB에서 migration을 적용해본다.
4. 애플리케이션을 실행해 `ddl-auto: validate` 검증이 통과하는지 확인한다.
5. 필요 시 repository/query/native SQL도 함께 수정한다.

## 금지 사항

- `application.yml`에서 `ddl-auto: update`로 되돌리지 않는다.
- 운영 DB에 직접 접속해 스키마를 임의 수정하지 않는다.
- 여러 서비스의 테이블을 하나의 migration 파일에서 함께 수정하지 않는다.
- 기존 migration 파일을 이미 공유된 이후에 수정하지 않는다.

## 기존 migration 수정 원칙

- 이미 다른 개발자나 환경에서 실행된 migration 파일은 수정하지 않는다.
- 잘못된 migration은 새 버전 파일로 정정한다.
- 예: `V4__fix_transaction_amount_scale.sql`

## 서비스별 초기 상태

현재 각 서비스에는 초기 migration이 추가되어 있다.

- `user-service`: `V1__init_user_service.sql`
- `transaction-service`: `V1__init_transaction_service.sql`
- `category-service`: `V1__init_category_service.sql`
- `account-book-service`: `V1__init_account_book_service.sql`

## 참고

- 환경별 적용 방법은 [DB_ENVIRONMENT_SETUP.md](./DB_ENVIRONMENT_SETUP.md) 문서를 따른다.
