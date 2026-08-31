# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

**소담(Sodam)** — 가볍게 기록하고 소비 습관을 파악하는 개인 맞춤형 가계부 웹 서비스.

- React 19 + TypeScript + Vite로 구현된 SPA
- 별도 백엔드 서버 없이 **Supabase를 단일 백엔드로 사용** (Auth + Postgres). 인증/세션과 도메인 데이터(거래·카테고리·예산·자산 등) 모두 `@supabase/supabase-js` 클라이언트로 직접 접근하며, 접근 제어는 Row Level Security(`supabase_rls.sql`, `supabase_setup.sql`)로 처리
- 오프라인 사용을 지원: 네트워크 요청 실패 시 로컬 큐에 저장했다가 재접속 시 동기화하며, 로그인 없이 쓸 수 있는 "게스트 모드"도 존재
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

- Supabase 세션의 `access_token`을 모듈 전역 변수로 들고 있다가 axios 인스턴스(`http`)의 `Authorization` 헤더에 주입.
- `supabase.auth.onAuthStateChange`로 세션 변경을 감지해 토큰을 자동 동기화.
- 401 응답 시 `refreshSupabaseToken()`으로 세션을 갱신한 뒤 원 요청을 재시도 (동시 다발 401은 `refreshSubscribers` 큐로 직렬화).
- 앱 시작 시 `restoreSession()`으로 세션 복구; 오프라인 상태에서 이전 세션 캐시(`sessionCache`)가 있으면 `OFFLINE_TOKEN` 플레이스홀더로 오프라인 접속을 허용.
- `app/App.tsx`의 `ProtectedRoute`는 `getAccessToken()` 또는 `guestMode.isActive()` 중 하나라도 참이면 인증된 것으로 간주.

### 오프라인 지원 & 게스트 모드

- `shared/lib/offlineQueue.ts`: POST/PUT/DELETE 요청이 네트워크 에러로 실패하면 큐에 적재. `api.syncOfflineQueue()`가 재접속 시 순차 재전송.
- `shared/lib/localCache.ts`: GET 응답을 캐싱해 오프라인일 때 최근 데이터를 재사용.
- `shared/lib/useOfflineSync.ts` + `shared/ui/OfflineBanner.tsx`: 온라인 상태 감지 및 동기화 트리거, 대기 중 요청 수 배너 표시.
- `shared/lib/guestMode.ts` / `guestStore.ts`: 로그인 없이 로컬 스토리지(`sodam_guest_*` 키)만으로 앱을 사용할 수 있는 모드. 실제 로그인 시 `userSync.ts`가 게스트 데이터를 서버로 이관하는 역할을 담당.

### 도메인 데이터 접근 (`entities/*/api/*Api.ts`)

- 모든 도메인 엔티티(거래·카테고리·예산·자산·반복거래·가계부)는 `supabase.from(...)` 쿼리로 직접 Supabase 테이블에 접근함. 별도 REST 백엔드는 없음.
- `shared/api/api.ts`의 axios `http` 인스턴스(`api.get/post/put/delete`)는 토큰 갱신·오프라인 큐잉 인프라로 남아 있지만, 현재 이를 실제로 호출하는 도메인 코드는 없음(과거 백엔드용이었던 `LoginApi`/`SignupApi`는 제거됨). 향후 REST 연동이 다시 필요할 때를 위한 기반 코드로 이해할 것.

## 주의사항

- ESLint는 `--max-warnings 0`으로 실행되므로 커밋 전 `npm run lint` 통과 필수.
- `entities/accountbook/model/AccountBookContext.tsx`는 Context+훅을 한 파일에서 export하기 때문에 `react-refresh/only-export-components` 규칙이 예외 처리되어 있음 (`eslint.config.js` 참고). 유사한 패턴을 다른 파일에 추가할 때 규칙 예외가 필요한지 확인할 것.
- 새 도메인을 추가할 때는 `entities`(데이터/훅) → `features`(액션 UI) → `pages`(화면 조립) 순서의 기존 레이어 구조를 따를 것.
