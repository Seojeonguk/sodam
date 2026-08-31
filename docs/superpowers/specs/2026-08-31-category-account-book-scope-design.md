# 카테고리 가계부 단위 공유 전환 설계

- 작성일: 2026-08-31
- 브랜치: `fix/account-book-shared-visibility`
- 배경: [[IMPROVEMENTS.md]] 1-1 항목 및 후속 대화에서 발견된 문제 — `transaction`/`budget`/`recurring_transaction`은 가계부 단위 공유로 수정했지만, `category`는 스키마상 `account_book_seq` 컬럼 자체가 없어 여전히 사용자 단위(`user_seq`)로만 동작함. 초대받은 멤버가 가계부에 들어가도 본인이 만든 적 없는 카테고리는 볼 수 없고, 카테고리별 예산/통계 집계도 가계부 전체가 아닌 개인 단위로만 계산됨.

## 목표

`category`를 `transaction`/`budget`/`recurring_transaction`/`asset`과 동일하게 가계부(account_book) 단위 공유 리소스로 전환한다. 기존 데이터는 최대한 자연스럽게 보존하고, 게스트 모드 → 실계정 전환 흐름이 깨지지 않도록 한다.

## 범위 밖

- `transaction`/`budget`/`recurring_transaction`의 쓰기 권한 모델(생성자 본인만) 변경 — 이번 작업과 무관, 그대로 유지.
- 카테고리 이름 중복/정규화, 카테고리 트리 구조 등 새로운 기능 — 요청 범위 아님.

## 1. 스키마 변경

### 1-1. 신규 설치용 (`supabase_setup.sql`)

`category` 테이블에 컬럼 추가:

```sql
ALTER TABLE ... -- 실제로는 CREATE TABLE 정의에 컬럼 추가
account_book_seq BIGINT
```

- 기존 `user_seq` 컬럼은 그대로 유지 — 더 이상 "소유자" 의미가 아니라 "생성자(작성자)" 의미로 재해석. 감사(audit)/향후 확장 목적으로 컬럼 자체는 보존.
- `idx_category_account_book_seq` 인덱스 추가.

### 1-2. 기존 운영 DB용 마이그레이션 (신규 파일 `supabase_migration_category_account_book_scope.sql`)

1. `ALTER TABLE category ADD COLUMN IF NOT EXISTS account_book_seq BIGINT;`
2. 백필 우선순위 (각 단계는 이전 단계에서 채워지지 않은 행만 대상):
   1. `user_seq`가 **OWNER**로 속한 가계부 중 가장 먼저 생성된(= `account_book_member.created_at` 기준 최솟값) 가계부
   2. 위에서 못 찾은 경우, `user_seq`가 속한 **아무** 가계부 중 가장 먼저 생성된 것 (예: 소유했던 유일한 가계부를 삭제한 극단적 예외)
   3. 그래도 없으면 NULL로 남김 — 해당 사용자는 현재 소속 가계부가 전혀 없는 상태이므로 카테고리도 자연스럽게 아무에게도 보이지 않게 됨(추가 처리 불필요).
3. 인덱스 추가.
4. NULL이 하나도 없는 경우에만 `NOT NULL` 제약을 시도(`DO $$ ... $$` 블록으로 조건부 실행, 실패해도 스크립트 전체가 죽지 않도록).
5. 스크립트는 `supabase_migration_dedupe_account_book_member.sql`과 동일하게 한 번만 실행하는 운영 DB용 스크립트로 작성하고, 재실행해도 안전하도록(`ADD COLUMN IF NOT EXISTS`, 이미 값이 있는 행은 백필 대상에서 제외) 만든다.

## 2. RLS 정책 (`supabase_rls.sql`)

- 신규 헬퍼 함수 `get_my_editable_account_book_ids()` 추가 — `account_book_member`에서 `authority IN ('OWNER', 'EDITOR')`인 가계부 ID 목록 반환 (`get_my_owned_account_book_ids()`와 동일한 SECURITY DEFINER 패턴).
- 기존 `category_own` (FOR ALL, `user_seq` 기준) 정책 제거, 아래 두 정책으로 교체:
  - `category_select`: `FOR SELECT USING (account_book_seq IN (SELECT get_my_account_book_ids()))`
  - `category_write`: `FOR ALL USING/WITH CHECK (account_book_seq IN (SELECT get_my_editable_account_book_ids()))`
- 이전에 넣어둔 "category는 account_book_seq가 없어 공유 불가" 주석은 제거.

## 3. 애플리케이션 코드

### 3-1. `entities/category/api/categoryApi.ts`

- `getCategories(accountBookSeq: number, type?)` — `_page`/`_size`(현재 미사용) 파라미터 제거, `.eq("account_book_seq", accountBookSeq)` 필터 추가.
- 타입 분리: 기존 `CategoryUpsertRequest`(update용, 현행 유지)와 별도로 `CategoryCreateRequest extends CategoryUpsertRequest { accountBookSeq: number }`를 추가해 `createCategory(data: CategoryCreateRequest)`가 이를 받도록 함 — `updateCategory`는 accountBookSeq를 바꾸지 않으므로 기존 시그니처 유지.
- `createCategory` insert에 `account_book_seq: data.accountBookSeq` 추가 (`user_seq: userSeq`는 생성자 정보로 계속 기록).

### 3-2. `entities/category/model/useCategories.ts`

- `useClassifications(accountBookId)`와 동일한 패턴으로 `useCategories(accountBookSeq: number | null | undefined)`로 변경, `accountBookSeq`가 바뀌면 재조회.

### 3-3. 호출부 업데이트 (전부 이미 `currentAccountBook`/`accountBookSeq` 컨텍스트 보유, 순수 배관 작업)

| 파일 | 변경 |
|---|---|
| `pages/category/ui/CategoryPage.tsx` | `useCategories(currentAccountBook?.id)` |
| `features/category/ui/CategoryCreateModal.tsx` | `accountBookId` prop 추가(부모인 `CategoryPage`에서 전달), `createCategory`에 `accountBookSeq` 포함 |
| `features/transaction/ui/TransactionCreateModal.tsx` | `getCategories(currentAccountBook.id, type)` |
| `features/transaction/ui/TransactionEditModal.tsx` | 동일 |
| `features/transaction/ui/TransactionImportModal.tsx` | 카테고리 자동 매칭 조회를 `currentAccountBook` 존재할 때만 수행하도록 감싸고 `accountBookSeq` 전달, 신규 카테고리 생성 시에도 `accountBookSeq` 포함 |
| `pages/budget/ui/BudgetPage.tsx` | `useAccountBookContext()`를 새로 호출해 `currentAccountBook.id`를 얻고 effect deps에 추가 |
| `pages/transaction/ui/TransactionPage.tsx` | 동일 |
| `pages/recurring/ui/RecurringPage.tsx` | 이미 보유한 `accountBookSeq`(useRecurring 반환값) 사용 |
| `entities/budget/api/budgetApi.ts` (`getBudgetSummary`) | 카테고리 조회를 `.eq("user_seq", userSeq)` → `.eq("account_book_seq", accountBookSeq)`로 변경 |

### 3-4. 기본 데이터 시딩 리팩터 (`shared/lib/userSync.ts`, `entities/accountbook/api/accountBookApi.ts`)

- 새 함수 `seedAccountBookDefaults(accountBookId: number, userId: number, options?: { includeCategories?: boolean }): Promise<void>`를 `userSync.ts`에 추가 — classification 3종은 항상 삽입, `includeCategories !== false`일 때만 `DEFAULT_CATEGORIES` 삽입(`account_book_seq`, `user_seq` 둘 다 채움).
- `doSyncUser`의 신규 유저 생성 분기에서 기존 인라인 classification/category 삽입 코드를 `seedAccountBookDefaults(book.id, userId)` 호출로 교체.
- `accountBookApi.createAccountBook(name: string, opts?: { seedDefaultCategories?: boolean })` — 가계부+멤버 생성 뒤 `seedAccountBookDefaults(book.id, userSeq, { includeCategories: opts?.seedDefaultCategories ?? true })` 호출 추가.
- `features/auth/lib/guestMigration.ts`: `createAccountBook("나의 가계부", { seedDefaultCategories: false })`로 변경(게스트가 직접 만든 카테고리를 그대로 업로드하는 흐름이므로 기본 카테고리 중복 방지), 이어지는 `categoryApi.createCategory(...)` 호출에 `accountBookSeq: serverAccountBookId` 추가.
- `ensureDefaultData`의 카테고리 보완 체크(`catCount`)는 `.eq("user_seq", userId)` → `.eq("account_book_seq", accountBookId)`로 변경 (기존처럼 `memberships[0]` 기준 유지, 이 함수의 "여러 가계부 중 첫 번째만 보정" 한계는 기존 classification 로직과 동일하게 그대로 둠 — 범위 밖).

## 4. 테스트 / 검증 계획

- 자동 테스트 프레임워크가 없는 프로젝트이므로(README/CLAUDE.md 확인됨), `npx tsc --noEmit` + `npm run lint`(기존 208개 베이스라인 대비 증가 없는지)로 정적 검증.
- 수동 시나리오 (개발자가 로컬에서 확인, Supabase 프로젝트에 마이그레이션 적용 후):
  1. 기존 계정으로 로그인 → 카테고리 목록이 마이그레이션 전과 동일하게 보이는지(백필 확인).
  2. 새 가계부 생성(`AccountBookCreateModal`) → 기본 카테고리 9개 + 분류 3종이 즉시 보이는지.
  3. 가계부에 EDITOR로 초대된 멤버 계정으로 로그인 → OWNER가 만든 카테고리가 보이고, 새 카테고리를 만들 수 있는지 / VIEWER 권한 멤버는 조회만 가능하고 생성 시 에러가 나는지.
  4. 게스트 모드에서 카테고리 커스터마이징(추가/이름 변경) 후 회원 전환 → 기본 카테고리가 중복 생성되지 않고 게스트가 만든 카테고리만 서버에 올라가는지.
  5. 예산 페이지에서 카테고리별 실사용액이 가계부 전체 기준으로 집계되는지(이미 이전 작업에서 거래 쪽은 고쳤으므로, 카테고리 목록도 공유됨을 확인).

## 5. 리스크 / 알려진 한계

- `ensureDefaultData`가 여러 가계부 중 `memberships[0]`(순서 보장 없음) 하나만 보정하는 기존 한계는 그대로 유지됨 — 여러 가계부를 가진 사용자의 2번째 이후 가계부는 카테고리가 비어 있어도 자동 보정되지 않을 수 있음(단, `createAccountBook()`이 생성 시점에 항상 시딩하므로, 이 경로로 만들어진 가계부는 문제 없음. 문제가 될 수 있는 경우는 오직 DB에 직접 삽입되는 등 비정상 경로뿐).
- 마이그레이션 백필은 `account_book_member.created_at`(문자열 `YYYYMMDDHHmmss`) 사전순 정렬에 의존 — 이 컬럼이 항상 채워져 있다는 기존 전제를 그대로 따름(다른 테이블도 동일 전제 사용 중).
- RLS 변경은 이전 작업(`transaction`/`budget`/`recurring_transaction`)과 마찬가지로 Supabase 대시보드에서 SQL을 직접 실행해야 반영됨 — 코드 배포만으로는 적용되지 않음.
