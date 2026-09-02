# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

**소담(Sodam)** — 가볍게 기록하고 소비 습관을 파악하는 개인 맞춤형 가계부 웹 서비스.

- React 19 + TypeScript + Vite로 구현된 SPA
- 별도 백엔드 서버 없이 **Supabase를 단일 백엔드로 사용** (Auth + Postgres). 인증/세션과 도메인 데이터(거래·카테고리·예산·자산 등) 모두 `@supabase/supabase-js` 클라이언트로 직접 접근하며, 접근 제어는 Row Level Security(`supabase_rls.sql`, `supabase_setup.sql`)로 처리
- 오프라인 상태를 감지해 배너로 알리며, 로그인 없이 쓸 수 있는 "게스트 모드"도 존재
- UI는 MUI(Material UI) 기반, 모바일 반응형 레이아웃을 우선 고려

## 빌드 및 실행 명령어

```bash
npm run dev            # 개발 서버 (Vite)
npm run build           # tsc --noEmit 타입 체크 후 프로덕션 빌드
npm run preview          # 빌드 결과 로컬 미리보기
npm run lint            # ESLint (경고 0개 기준, --max-warnings 0)
npm run lint:fix         # ESLint 자동 수정
npm run format           # Prettier 전체 포맷팅
npm run format:check       # Prettier 검사만 수행
```

- 테스트 러너는 구성되어 있지 않음 (테스트 스크립트 없음).
- Supabase 관련 환경변수(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 등)는 `.env`에 정의.
- `vite.config.ts`에 과거 백엔드 서버(제거됨)를 겨냥한 `/api/transactions` 프록시 설정이 남아 있으나 실제로는 사용되지 않음(axios 클라이언트가 상대 경로가 아닌 절대 URL을 사용하므로 이 프록시를 거치지 않음).

## 아키텍처

Feature-Sliced Design(FSD) 스타일 레이어 구조를 사용하며, `src/` 하위는 다음과 같이 나뉨 (위에서 아래로 하위 레이어만 참조 가능):

```
app/       라우팅(App.tsx), 레이아웃(AppShellLayout, AuthLayout), 테마
pages/     라우트에 매핑되는 화면 (dashboard, transaction, budget, recurring, member-stats, asset, category, login, signup)
features/  사용자 액션 단위 UI (auth, transaction, budget, recurring, member, profile, category, asset, accountbook)
entities/  도메인 모델 + API 훅 (transaction, accountbook, asset, budget, category, recurringTransaction)
shared/    공통 api 클라이언트, lib, ui, config
```

각 슬라이스는 보통 `api/`(요청 함수·타입), `model/`(상태·훅), `ui/`(컴포넌트), `lib/`(유틸) 하위 폴더로 구성됨. import는 상대 경로를 사용하며 별도 path alias는 설정되어 있지 않음.

### 인증 & 세션 (`shared/api/api.ts`, `shared/lib/supabase.ts`)

- `shared/api/api.ts`는 Supabase 세션 토큰만 다루는 모듈: `access_token`을 모듈 전역 변수로 들고 `getAccessToken`/`setAccessToken`/`clearAccessToken`으로 노출.
- `supabase.auth.onAuthStateChange`로 세션 변경을 감지해 토큰을 자동 동기화.
- 앱 시작 시 `restoreSession()`으로 세션 복구; 오프라인 상태에서 이전 세션 캐시(`sessionCache`)가 있으면 `OFFLINE_TOKEN` 플레이스홀더로 오프라인 접속을 허용. 재접속 시 `refreshSupabaseToken()`으로 실제 토큰으로 교체.
- `app/App.tsx`의 `ProtectedRoute`는 `getAccessToken()` 또는 `guestMode.isActive()` 중 하나라도 참이면 인증된 것으로 간주.

### 오프라인 지원 & 게스트 모드

- `shared/lib/useOfflineSync.ts` + `shared/ui/OfflineBanner.tsx`: `navigator.onLine` 기반으로 온라인/오프라인 상태만 감지해 배너로 표시. 별도의 쓰기 요청 큐잉/재시도는 없음(도메인 쓰기가 모두 `supabase.from()`을 직접 호출하므로 오프라인 중 쓰기는 그냥 실패함).
- `shared/lib/guestMode.ts` / `entities/guest/lib/guestStore.ts`: 로그인 없이 로컬 스토리지(`sodam_guest_*` 키)만으로 앱을 사용할 수 있는 모드. 실제 로그인 시 `userSync.ts`가 게스트 데이터를 서버로 이관하는 역할을 담당. `guestStore.ts`는 여러 엔티티의 응답 타입을 그대로 사용해야 해서 `entities/guest`에 위치함(`shared`는 상위 레이어를 참조할 수 없음).

### 도메인 데이터 접근 (`entities/*/api/*Api.ts`)

- 모든 도메인 엔티티(거래·카테고리·예산·자산·반복거래·가계부)는 `supabase.from(...)` 쿼리로 직접 Supabase 테이블에 접근함. 별도 REST 백엔드는 없음.
- 과거 REST 백엔드를 겨냥했던 axios 기반 `http` 클라이언트(`api.get/post/put/delete`)와 오프라인 쓰기 큐는 어떤 도메인 코드도 호출하지 않는 죽은 코드였기 때문에 삭제함(`shared/lib/offlineQueue.ts`도 함께 제거). `shared/api/api.ts`에는 세션/토큰 관련 함수만 남아 있음.

## 주의사항

- ESLint는 `--max-warnings 0`으로 실행되므로 커밋 전 `npm run lint` 통과 필수.
- `entities/accountbook/model/AccountBookContext.tsx`는 Context+훅을 한 파일에서 export하기 때문에 `react-refresh/only-export-components` 규칙이 예외 처리되어 있음 (`eslint.config.js` 참고). 유사한 패턴을 다른 파일에 추가할 때 규칙 예외가 필요한지 확인할 것.
- 새 도메인을 추가할 때는 `entities`(데이터/훅) → `features`(액션 UI) → `pages`(화면 조립) 순서의 기존 레이어 구조를 따를 것.

## SUPABASE

- 테이블 관련 SQL은 supabase_setup.sql 하나의 파일에서 관리한다.
  - 해당 파일에서는 오직 테이블, 인덱스의 create 구문만 작성한다.
- RLS 관련 SQL은 supabase_rls.sql 하나의 파일에서 관리한다.

## Github

- 커밋 메시지는 커밋 컨벤션(feat: 커밋제목, refactor: 커밋제목 등)을 지켜야한다.
- Subject Rule
  1. 제목은 최대 50글자 넘지 않기
  2. 마침표 및 특수기호 사용x
  3. 첫 글자 대문자, 명령문 사용
  4. 개조식 구문으로 작성(간결하고 요점적인 서술)
- Body Rule
  1. 한 줄당 72자 내로 작성
  2. 최대한 상세히 작성
  3. 어떻게 보다는 '무엇을', '왜' 변경했는지에 대해 작성
- Footer Rule
  1. 유형: #이슈 번호의 형식으로 작성
  2. 이슈 트래커 ID를 작성
  3. 여러개의 이슈 번호는 ,로 구분
  4. 이슈 트래커 유형은 아래와 같다
    1) Fixes : 이슈 수정중(아직 해결되지 않은 경우)
    2) Resolves : 이슈를 해결한 경우
    3) Ref : 참조할 이슈가 있을 때 사용
    4) Related to : 해당 커밋에 관련된 이슈 번호(아직 해결되지 않은 경우)
- signed-off commit 을 필수로 작성한다.