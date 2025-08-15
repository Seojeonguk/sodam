# 1단계: 빌드 환경 설정
FROM gradle:8.13-jdk17 AS build

# 작업 디렉토리 설정
WORKDIR /app

# STEP 1: Gradle 설정 파일 및 소스 코드 복사 (빌드에 필요한 모든 것을 먼저 복사)
# 캐싱 전략을 위해 build.gradle을 먼저 복사하고 의존성을 다운로드하는 것은 좋지만,
# 애플리케이션 빌드를 위해서는 소스 코드도 있어야 합니다.
# 따라서 빌드 명령 전에 소스 코드를 복사해야 합니다.
COPY build.gradle .
COPY src src

# STEP 2: 애플리케이션 빌드
# 'clean'은 이전 빌드 결과물을 제거하여 항상 깨끗한 빌드를 보장합니다.
# 'bootJar'는 Spring Boot 실행 가능한 JAR 파일을 생성합니다.
# '--no-daemon'은 Docker 환경에서 Gradle 데몬을 사용하지 않도록 하여 빌드 완료 후 프로세스가 깔끔하게 종료되도록 합니다.
RUN gradle clean bootJar --no-daemon

# 2단계: 최종 런타임 이미지 설정
FROM eclipse-temurin:17-jre-alpine

# JAR 파일이 빌드된 위치를 기반으로 복사합니다.
COPY --from=build /app/build/libs/*.jar /app/app.jar

# 애플리케이션 실행 명령어
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
