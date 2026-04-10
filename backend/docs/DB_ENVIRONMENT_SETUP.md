# DB Environment Setup

## 목적

이 문서는 환경별로 DB와 migration이 어떻게 적용되는지 정리한다.

## 공통 동작 방식

- 애플리케이션 시작 시 Flyway가 먼저 migration을 수행한다.
- 그 다음 JPA가 `ddl-auto: validate`로 스키마를 검증한다.
- 스키마가 migration 결과와 다르면 애플리케이션은 시작에 실패한다.

## 필요한 환경변수

DB 관련 공통 환경변수:

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`

추가 환경변수:

- `EUREKA_DEFAULT_ZONE`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `KAKAO_CLIENT_ID`
- `KAKAO_CLIENT_SECRET`
- `KAKAO_REDIRECT_URI`

## 로컬 실행

기본적으로 각 서비스는 아래 기본값을 사용한다.

- `DB_URL` 기본값: `jdbc:mariadb://localhost:3310/sodam`
- `DB_USERNAME` 기본값: `sodam`
- `EUREKA_DEFAULT_ZONE` 기본값: `http://localhost:8761/eureka/`

즉, 로컬에서는 최소한 `DB_PASSWORD`는 반드시 지정해야 한다.

예시 PowerShell:

```powershell
$env:DB_PASSWORD="your-db-password"
$env:JWT_SECRET="your-jwt-secret"
java -jar .\user-service\build\libs\user-service-0.0.1-SNAPSHOT.jar
```

## IntelliJ 실행

IntelliJ에서는 `Run/Debug Configurations`의 `Environment variables`에 값을 넣는다.

예시:

```text
DB_URL=jdbc:mariadb://localhost:3310/sodam;DB_USERNAME=sodam;DB_PASSWORD=...;JWT_SECRET=...
```

주의:

- `Environment variables`에 넣는 것이 기본 방식이다.
- `VM options`는 `-Dspring.profiles.active=...` 같은 JVM 옵션 용도로만 사용한다.

## Docker Compose 실행

Docker Compose는 `backend/infra/docker-compose.yml`에서 환경변수를 주입한다.
실행 전 `backend/infra/.env.example`를 복사해 실제 `.env` 파일을 준비한다.

예시:

```powershell
Copy-Item .\backend\infra\.env.example .\backend\infra\.env
```

그 후 `.env`의 값을 실제 값으로 수정하고 실행한다.

예시:

```powershell
docker compose --env-file .\backend\infra\.env -f .\backend\infra\docker-compose.yml up --build
```

## 기존 DB가 있는 환경

기존 DB가 이미 존재하는 경우 현재 설정은 다음 기준으로 동작한다.

- Flyway는 `baseline-on-migrate: true`로 동작한다.
- 기존 스키마가 있으면 Flyway가 해당 상태를 기준선으로 등록할 수 있다.
- 이후 새 migration부터는 Flyway가 버전 관리한다.

주의:

- 기존 운영 DB 구조가 현재 엔티티와 다르면 `validate` 단계에서 애플리케이션 시작이 실패할 수 있다.
- 이 경우 직접 DB를 수정하지 말고 새 migration 파일로 차이를 반영한다.

## 신규 DB 환경

새 DB에서는 각 서비스의 `V1__init_*.sql`가 먼저 실행된다.
즉, 스키마가 없는 상태에서도 migration만으로 테이블이 생성되어야 한다.

## 배포 시 체크리스트

- 필요한 환경변수가 모두 준비되어 있는가
- migration 파일이 서비스별로 추가되어 있는가
- 운영 DB에 직접 반영한 스키마 변경이 없는가
- 애플리케이션 실행 전후 Flyway 로그를 확인했는가
- `ddl-auto`가 `validate`로 유지되고 있는가

## 관련 파일

- `backend/infra/docker-compose.yml`
- `backend/infra/.env.example`
- `user-service/src/main/resources/db/migration`
- `transaction-service/src/main/resources/db/migration`
- `category-service/src/main/resources/db/migration`
- `account-book-service/src/main/resources/db/migration`
