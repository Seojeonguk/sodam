# Sodam 실행 및 배포 가이드

## 문서 목적

이 문서는 Sodam 프로젝트를 로컬 또는 Docker 환경에서 실행하기 위한 구성, 환경 변수, 서비스 시작 순서, 검증 방법을 정리한다.

## 구성 요소

| 구성 | 기술 | 위치 |
| --- | --- | --- |
| Backend | Spring Boot, Spring Cloud, Gradle | `backend` |
| Frontend | React, Vite, TypeScript, MUI | `frontend` |
| Database | MariaDB 11.7.2 | `backend/infra/docker-compose.yml` |
| Discovery | Eureka Server | `backend/eureka-server` |
| Gateway | Spring Cloud Gateway | `backend/gateway-service` |

## 포트

| 서비스 | 포트 |
| --- | ---: |
| MariaDB | 3310 |
| Eureka Server | 8761 |
| Transaction Service | 10001 |
| User Service | 10002 |
| Gateway Service | 10003 |
| Category Service | 10004 |
| Account Book Service | 10005 |
| Frontend Dev Server | Vite 기본값 또는 지정 포트 |

## 필수 환경 변수

### 공통

| 변수 | 설명 | 예시/기본값 |
| --- | --- | --- |
| `DB_URL` | DB JDBC URL | `jdbc:mariadb://localhost:3310/sodam` |
| `DB_USERNAME` | DB 사용자 | `sodam` |
| `DB_PASSWORD` | DB 비밀번호 | 필수 |
| `EUREKA_DEFAULT_ZONE` | Eureka 주소 | `http://localhost:8761/eureka/` |

### 인증/OAuth

| 변수 | 설명 |
| --- | --- |
| `JWT_SECRET` | JWT 서명 secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client id |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | Google OAuth redirect URI |
| `KAKAO_CLIENT_ID` | Kakao OAuth client id |
| `KAKAO_CLIENT_SECRET` | Kakao OAuth client secret |
| `KAKAO_REDIRECT_URI` | Kakao OAuth redirect URI |
| `FRONTEND_APP_URL` | OAuth 완료 후 이동할 프론트엔드 URL |

### 내부 API

| 변수 | 설명 |
| --- | --- |
| `INTERNAL_SERVICE_TOKEN` | `/internal/**` 서비스 간 호출 검증 토큰 |

### 프론트엔드

| 변수 | 설명 | 기본값 |
| --- | --- | --- |
| `VITE_API_TRANSACTION_BASE_URL` | Gateway API base URL | `http://localhost:10003/api` |
| `VITE_AUTH_BASE_URL` | OAuth authorization base URL | `https://junguk7880.site` |

## 로컬 실행 순서

### 1. DB 실행

Docker Compose의 DB 서비스만 사용하거나 전체 compose를 사용할 수 있다.

```powershell
cd backend\infra
docker compose up -d db
```

### 2. Eureka 실행

```powershell
cd backend
.\gradlew.bat :eureka-server:bootRun
```

### 3. 업무 서비스 실행

각 서비스는 Eureka에 등록되어야 하므로 Eureka 실행 후 시작한다.

```powershell
.\gradlew.bat :user-service:bootRun
.\gradlew.bat :account-book-service:bootRun
.\gradlew.bat :category-service:bootRun
.\gradlew.bat :transaction-service:bootRun
```

### 4. Gateway 실행

```powershell
.\gradlew.bat :gateway-service:bootRun
```

### 5. Frontend 실행

```powershell
cd frontend
npm install
npm run dev
```

## Docker Compose 실행

`backend/infra/docker-compose.yml`은 MariaDB, Eureka, Gateway, 각 업무 서비스를 정의한다.

```powershell
cd backend\infra
docker compose up -d
```

종료:

```powershell
docker compose down
```

볼륨까지 삭제:

```powershell
docker compose down -v
```

## 빌드

### Backend

```powershell
cd backend
.\gradlew.bat build
```

특정 서비스 빌드:

```powershell
.\gradlew.bat :transaction-service:build
```

### Frontend

```powershell
cd frontend
npm run build
```

## 검증

### Health Check

| 대상 | URL |
| --- | --- |
| Eureka | `http://localhost:8761` |
| Gateway health | `http://localhost:10003/actuator/health` |

각 서비스의 actuator 노출 범위는 설정에 따라 다르다. Gateway는 `health,info` endpoint를 노출한다.

### 기본 API 확인

Gateway를 통해 회원가입/로그인 API를 호출해 전체 라우팅과 DB 연결을 확인한다.

```powershell
curl -X POST http://localhost:10003/api/auth/register `
  -H "Content-Type: application/json" `
  -d "{\"email\":\"test@example.com\",\"password\":\"password\",\"name\":\"tester\"}"
```

```powershell
curl -X POST http://localhost:10003/api/auth/login `
  -H "Content-Type: application/json" `
  -d "{\"email\":\"test@example.com\",\"password\":\"password\"}"
```

## DB 마이그레이션

각 업무 서비스는 시작 시 Flyway migration을 수행한다. 이후 JPA가 `ddl-auto: validate`로 스키마를 검증한다.

스키마 변경 시:

1. 해당 서비스의 `src/main/resources/db/migration`에 새 migration 파일을 추가한다.
2. 파일명은 `V{number}__{description}.sql` 형식을 따른다.
3. 애플리케이션을 시작해 Flyway 적용과 JPA validation을 확인한다.

자세한 정책은 [DB_MIGRATION_POLICY.md](./DB_MIGRATION_POLICY.md)를 따른다.

## 운영 배포 체크리스트

| 항목 | 확인 |
| --- | --- |
| DB 접속 정보 | `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` 설정 |
| JWT Secret | 충분히 긴 운영 secret 사용 |
| 내부 API Token | 모든 백엔드 서비스에 동일한 `INTERNAL_SERVICE_TOKEN` 설정 |
| OAuth Redirect URI | 운영 도메인과 OAuth provider 설정 일치 |
| Eureka 주소 | 서비스들이 운영 Eureka에 등록 가능한지 확인 |
| Gateway 라우팅 | `/api/**` 공개, `/internal/**` 차단 확인 |
| CORS | 프론트엔드 운영 도메인 허용 여부 확인 |
| Flyway | 운영 DB migration 적용 전 백업 및 검토 |

## 자주 발생하는 문제

| 증상 | 확인 항목 |
| --- | --- |
| 서비스 시작 실패 | `DB_PASSWORD`, DB 실행 여부, Flyway migration 실패 로그 |
| JPA validation 실패 | 엔티티와 DB migration 스키마 불일치 |
| Gateway 401 | access token 누락/만료, JWT secret 불일치 |
| Gateway 404 on `/internal/**` | 정상 동작. 내부 API는 Gateway로 호출하지 않는다. |
| Feign 내부 호출 실패 | Eureka 등록, 대상 서비스 상태, `INTERNAL_SERVICE_TOKEN` 설정 |
| 프론트엔드 API 실패 | `VITE_API_TRANSACTION_BASE_URL`, Gateway 포트, CORS |

## 관련 문서

| 문서 | 설명 |
| --- | --- |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 시스템 구조 |
| [API_SPECIFICATION.md](./API_SPECIFICATION.md) | API 명세 |
| [INTERNAL_API_SECURITY.md](./INTERNAL_API_SECURITY.md) | 내부 API 보안 |
| [DB_ENVIRONMENT_SETUP.md](./DB_ENVIRONMENT_SETUP.md) | DB 환경 설정 |
