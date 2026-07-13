# Sodam Backend Documents

이 디렉터리는 Sodam 백엔드의 설계, 기능, API, 운영 기준 문서를 모아둔 문서 허브이다.

## 문서 목록

### 제품 및 기능

| 문서 | 설명 |
| --- | --- |
| [FEATURE_SPECIFICATION.md](./FEATURE_SPECIFICATION.md) | 현재 구현된 기능 범위, 사용자 흐름, 비즈니스 규칙, 제한 사항 |
| [API_SPECIFICATION.md](./API_SPECIFICATION.md) | 공개 API, 내부 API, 요청/응답 DTO, 인증 및 라우팅 규칙 |
| [SCREEN_SPECIFICATION.md](./SCREEN_SPECIFICATION.md) | 프론트엔드 화면별 목적, 입력, 상태, 연동 API |

### 아키텍처 및 데이터

| 문서 | 설명 |
| --- | --- |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | MSA 구성, Gateway/Eureka 흐름, 서비스 책임, 서비스 간 연동 |
| [DATA_MODEL.md](./DATA_MODEL.md) | ERD, 테이블 구조, 인덱스, 논리 관계 |

### 내부 API

| 문서 | 설명 |
| --- | --- |
| [INTERNAL_API_GUIDE.md](./INTERNAL_API_GUIDE.md) | `/internal/**` API 작성 및 사용 기준 |
| [INTERNAL_API_SECURITY.md](./INTERNAL_API_SECURITY.md) | 내부 API 인증 헤더, Gateway 차단 정책, 서비스 간 호출 보안 |

### 데이터베이스 및 운영

| 문서 | 설명 |
| --- | --- |
| [RUN_DEPLOYMENT_GUIDE.md](./RUN_DEPLOYMENT_GUIDE.md) | 로컬/Docker 실행, 환경 변수, 빌드, 배포 체크리스트 |
| [TEST_SPECIFICATION.md](./TEST_SPECIFICATION.md) | 테스트 전략, 서비스별 테스트 범위, 핵심 시나리오 |
| [DB_ENVIRONMENT_SETUP.md](./DB_ENVIRONMENT_SETUP.md) | 로컬, Docker, 운영 환경별 DB 및 환경 변수 설정 |
| [DB_MIGRATION_POLICY.md](./DB_MIGRATION_POLICY.md) | Flyway/JPA 기반 DB 마이그레이션 정책 |

## 읽는 순서

1. 전체 구조를 파악하려면 [ARCHITECTURE.md](./ARCHITECTURE.md)를 먼저 읽는다.
2. 기능 관점으로 전체 범위를 파악하려면 [FEATURE_SPECIFICATION.md](./FEATURE_SPECIFICATION.md)를 확인한다.
3. 데이터 구조를 확인하려면 [DATA_MODEL.md](./DATA_MODEL.md)를 확인한다.
4. 클라이언트 또는 외부 연동을 구현하려면 [API_SPECIFICATION.md](./API_SPECIFICATION.md)를 확인한다.
5. 화면 구현 또는 QA를 진행하려면 [SCREEN_SPECIFICATION.md](./SCREEN_SPECIFICATION.md)를 확인한다.
6. 서비스 간 호출을 추가하거나 수정하려면 [INTERNAL_API_GUIDE.md](./INTERNAL_API_GUIDE.md)와 [INTERNAL_API_SECURITY.md](./INTERNAL_API_SECURITY.md)를 함께 확인한다.
7. 로컬 실행, Docker 실행, 테스트, DB 스키마 변경 작업은 운영/DB 관련 문서를 따른다.

## 문서 작성 규칙

- 기능 요구사항과 사용자 흐름은 `FEATURE_SPECIFICATION.md`에 작성한다.
- API 경로, 요청/응답 DTO, 인증 헤더는 `API_SPECIFICATION.md`에 작성한다.
- 시스템 구조와 서비스 책임은 `ARCHITECTURE.md`에 작성한다.
- 테이블, ERD, 인덱스, 데이터 관계는 `DATA_MODEL.md`에 작성한다.
- 화면별 동작과 상태는 `SCREEN_SPECIFICATION.md`에 작성한다.
- `/internal/**` 경로 규칙과 서비스 간 호출 원칙은 내부 API 문서에 작성한다.
- DB 스키마 변경, Flyway migration, 환경 변수는 DB 문서에 작성한다.
- 새 문서를 추가하면 이 `README.md`의 문서 목록도 함께 갱신한다.
