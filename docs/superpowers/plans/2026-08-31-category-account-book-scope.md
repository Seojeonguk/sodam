# 카테고리 가계부 단위 공유 전환 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `category` 테이블/기능을 사용자 단위(`user_seq`)에서 가계부 단위(`account_book_seq`) 공유 리소스로 전환한다 (이미 같은 방식으로 전환된 `transaction`/`budget`/`recurring_transaction`/`asset`과 동일한 패턴).

**Architecture:** `category`에 `account_book_seq` 컬럼을 추가하고 기존 데이터를 백필한다. RLS는 SELECT를 가계부 멤버십 기준으로, 쓰기(INSERT/UPDATE/DELETE)를 OWNER/EDITOR 권한 기준으로 연다. 애플리케이션 레이어는 `categoryApi`/`useCategories`가 `accountBookSeq`를 받도록 시그니처를 바꾸고, 이미 계정북 컨텍스트를 갖고 있는 8개 호출부를 배관 수준으로 갱신한다. 기본 카테고리/분류 시딩 로직은 "가입 시 1회"에서 "가계부 생성 시마다"로 옮기며, 게스트 모드 → 실계정 전환 흐름만 기본 카테고리 시딩을 건너뛰도록 옵션을 둔다.

**Tech Stack:** React 19 + TypeScript + Vite, Supabase(Postgres + RLS), MUI. 이 저장소에는 자동 테스트 러너가 없으므로(`package.json` 확인됨), 각 태스크의 검증은 `npx tsc --noEmit` + `npm run lint`(기존 208개 문제 베이스라인 대비 증가 없는지)로 대체한다. SQL 변경은 Supabase 대시보드에서 사람이 직접 실행해야 하므로 이 플랜에서는 "실행"이 아니라 "정확한 SQL 작성"까지만 다룬다.

**Spec:** `docs/superpowers/specs/2026-08-31-category-account-book-scope-design.md`

## Global Constraints

- ESLint는 `--max-warnings 0` 기준이지만, 이 저장소는 이미 208개의 사전 존재 lint 문제(179 errors + 29 warnings)를 갖고 있음이 확인됨 — 새 코드가 이 베이스라인을 **늘리지 않는 것**이 통과 기준이며, 208개를 0으로 줄이는 것은 이 작업의 범위가 아니다.
- `npm run build`는 `tsc --noEmit && vite build`이므로, 모든 태스크는 최소 `npx tsc --noEmit`을 통과해야 한다.
- import는 상대 경로만 사용, path alias 없음.
- Supabase 관련 SQL 파일(`supabase_setup.sql`, `supabase_rls.sql`, `supabase_migration_*.sql`)은 코드가 아니라 사람이 Supabase 대시보드 SQL Editor에서 직접 실행하는 스크립트다 — 이 플랜의 태스크들은 파일을 정확하게 작성하는 것까지만 책임지며, 실제 DB 적용은 사용자의 몫이다.
- FSD 레이어 규칙: `shared`는 `entities`를 참조할 수 없다. 이번 작업에서 `entities/accountbook/api/accountBookApi.ts`가 `shared/lib/userSync.ts`를 import하는 것은 허용된 방향(entities → shared)이므로 문제 없음.

---

### Task 1: 스키마 변경 — `supabase_setup.sql` + 신규 마이그레이션 스크립트

**Files:**
- Modify: `supabase_setup.sql`
- Create: `supabase_migration_category_account_book_scope.sql`

**Interfaces:**
- Produces: `category.account_book_seq BIGINT` 컬럼 (신규 설치 시 처음부터 존재, 기존 설치는 마이그레이션 스크립트로 추가). 이후 태스크의 RLS 정책과 `categoryApi.ts`가 이 컬럼명을 사용한다.

- [ ] **Step 1: `supabase_setup.sql`의 `category` 테이블 정의에 컬럼 추가**

`supabase_setup.sql`에서 아래 블록을 찾는다:

```sql
-- ── category ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.category (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255),
    description VARCHAR(255),
    user_seq    BIGINT,
    color       VARCHAR(255),
    type        VARCHAR(10) NOT NULL DEFAULT 'EXPENSE',  -- INCOME | EXPENSE
    created_at  VARCHAR(14) NOT NULL,
    updated_at  VARCHAR(14) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_category_user_seq ON public.category(user_seq);
```

다음으로 교체한다 (컬럼 추가 + 인덱스 추가, `user_seq`는 "생성자" 정보로 유지):

```sql
-- ── category ─────────────────────────────────────────────────
-- user_seq: 생성자(작성자) 정보. account_book_seq: 소속 가계부(공유 범위).
CREATE TABLE IF NOT EXISTS public.category (
    id               BIGSERIAL PRIMARY KEY,
    name             VARCHAR(255),
    description      VARCHAR(255),
    user_seq         BIGINT,
    account_book_seq BIGINT,
    color            VARCHAR(255),
    type             VARCHAR(10) NOT NULL DEFAULT 'EXPENSE',  -- INCOME | EXPENSE
    created_at       VARCHAR(14) NOT NULL,
    updated_at       VARCHAR(14) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_category_user_seq         ON public.category(user_seq);
CREATE INDEX IF NOT EXISTS idx_category_account_book_seq ON public.category(account_book_seq);
```

- [ ] **Step 2: 신규 마이그레이션 스크립트 작성**

`supabase_migration_category_account_book_scope.sql` 파일을 새로 만든다:

```sql
-- ============================================================
-- Sodam - category 테이블 가계부 단위 공유 전환 마이그레이션
--
-- 배경: category가 그동안 user_seq(작성자) 기준으로만 동작해, 가계부에
-- 초대된 멤버가 다른 멤버의 카테고리를 보거나 쓸 수 없었음. transaction/
-- budget/recurring_transaction과 동일하게 account_book_seq 기준 공유로
-- 전환한다.
--
-- 기존 Supabase 프로젝트(이미 데이터가 있는 DB)에 한 번만 실행하면 됨.
-- 여러 번 실행해도 안전하도록 작성됨(컬럼/값이 이미 있으면 건너뜀).
-- Supabase 대시보드 > SQL Editor
-- ============================================================

-- 1) 컬럼 추가 (이미 있으면 건너뜀)
ALTER TABLE public.category ADD COLUMN IF NOT EXISTS account_book_seq BIGINT;

-- 2) 백필 1단계: user_seq가 OWNER로 속한 가계부 중 가장 먼저 생성된 가계부
UPDATE public.category c
SET account_book_seq = sub.account_book_id
FROM (
  SELECT DISTINCT ON (abm.user_id) abm.user_id, abm.account_book_id
  FROM public.account_book_member abm
  WHERE abm.authority = 'OWNER'
  ORDER BY abm.user_id, abm.created_at ASC, abm.account_book_id ASC
) sub
WHERE c.user_seq = sub.user_id
  AND c.account_book_seq IS NULL;

-- 3) 백필 2단계: 1단계에서 못 채운 행 — user_seq가 속한 아무 가계부 중 가장 먼저 생성된 것
--    (본인이 OWNER인 가계부를 모두 삭제한 것 같은 예외 케이스 대비)
UPDATE public.category c
SET account_book_seq = sub.account_book_id
FROM (
  SELECT DISTINCT ON (abm.user_id) abm.user_id, abm.account_book_id
  FROM public.account_book_member abm
  ORDER BY abm.user_id, abm.created_at ASC, abm.account_book_id ASC
) sub
WHERE c.user_seq = sub.user_id
  AND c.account_book_seq IS NULL;

-- 4) 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_category_account_book_seq ON public.category(account_book_seq);

-- 5) 백필 결과 확인 후, NULL이 하나도 없을 때만 NOT NULL 제약 적용
--    (남아있는 NULL은 소속 가계부가 전혀 없는 사용자의 카테고리 — 이번 마이그레이션에서
--    강제로 채우지 않고, RLS상 아무에게도 보이지 않는 채로 남겨둔다)
DO $$
DECLARE
  v_null_count INT;
BEGIN
  SELECT COUNT(*) INTO v_null_count FROM public.category WHERE account_book_seq IS NULL;

  IF v_null_count = 0 THEN
    ALTER TABLE public.category ALTER COLUMN account_book_seq SET NOT NULL;
  ELSE
    RAISE NOTICE 'category.account_book_seq가 NULL인 행이 %건 남아있어 NOT NULL 제약을 건너뜁니다.', v_null_count;
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════
-- 완료! 다음 단계: supabase_rls.sql 재실행 (category_select/category_write 정책 반영)
-- ══════════════════════════════════════════════════════════════
```

- [ ] **Step 3: 두 파일의 SQL 문법을 육안으로 재검토**

`supabase_setup.sql`과 `supabase_migration_category_account_book_scope.sql`을 다시 읽어서, 괄호/세미콜론/따옴표 짝이 맞는지, 기존 테이블/컬럼 이름(`account_book_member`, `authority`, `created_at`)이 실제 스키마와 일치하는지 확인한다 (`supabase_setup.sql`의 `account_book_member` 테이블 정의와 대조).

- [ ] **Step 4: Commit**

```bash
git add supabase_setup.sql supabase_migration_category_account_book_scope.sql
git commit -m "$(cat <<'EOF'
feat: category 테이블에 account_book_seq 컬럼 추가 (가계부 단위 공유 준비)

신규 설치 스크립트(supabase_setup.sql)에 컬럼을 추가하고, 기존 운영
DB용 백필 마이그레이션(supabase_migration_category_account_book_scope.sql)을
작성했다. RLS 정책 갱신은 다음 커밋에서 진행한다.

Signed-off-by: Seojeonguk <junguk7880@naver.com>
EOF
)"
```

---

### Task 2: RLS 정책 갱신 — `supabase_rls.sql`

**Files:**
- Modify: `supabase_rls.sql`

**Interfaces:**
- Consumes: Task 1에서 추가한 `category.account_book_seq` 컬럼.
- Produces: `get_my_editable_account_book_ids()` SQL 함수 (신규) — 향후 다른 테이블에 "OWNER/EDITOR만 쓰기 가능" 정책이 필요해지면 재사용 가능.

- [ ] **Step 1: 헬퍼 함수 추가**

`supabase_rls.sql`에서 `get_my_owned_account_book_ids()` 함수 정의 바로 뒤에 아래 함수를 추가한다:

```sql
-- 현재 유저가 OWNER 또는 EDITOR 권한으로 속한 가계부 ID 목록 (RLS 우회)
CREATE OR REPLACE FUNCTION public.get_my_editable_account_book_ids()
RETURNS SETOF BIGINT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT account_book_id
  FROM public.account_book_member
  WHERE user_id = (SELECT id FROM public.users WHERE email = auth.email())
    AND authority IN ('OWNER', 'EDITOR')
$$;
```

- [ ] **Step 2: `category_own` 정책을 `category_select`/`category_write`로 교체**

기존 블록:

```sql
-- ── category ─────────────────────────────────────────────────
-- 주의: category 테이블에는 account_book_seq 컬럼이 없어 가계부 단위 공유가 불가능함(사용자 단위 소유).
-- 가계부 멤버 간 카테고리 공유가 필요하면 스키마 변경(account_book_seq 추가 + 데이터 마이그레이션)이 별도로 필요함.
DROP POLICY IF EXISTS "category_own" ON public.category;
CREATE POLICY "category_own" ON public.category
  FOR ALL
  USING     (user_seq = public.get_my_user_seq())
  WITH CHECK (user_seq = public.get_my_user_seq());
```

교체 후:

```sql
-- ── category ─────────────────────────────────────────────────
-- SELECT: 내가 속한 가계부의 카테고리 전체 조회 가능
-- INSERT/UPDATE/DELETE: 내가 OWNER 또는 EDITOR 권한으로 속한 가계부의 카테고리만
--                        (VIEWER는 조회만 가능)
DROP POLICY IF EXISTS "category_own" ON public.category;
DROP POLICY IF EXISTS "category_select" ON public.category;
DROP POLICY IF EXISTS "category_write" ON public.category;

CREATE POLICY "category_select" ON public.category
  FOR SELECT
  USING (account_book_seq IN (SELECT public.get_my_account_book_ids()));

CREATE POLICY "category_write" ON public.category
  FOR ALL
  USING     (account_book_seq IN (SELECT public.get_my_editable_account_book_ids()))
  WITH CHECK (account_book_seq IN (SELECT public.get_my_editable_account_book_ids()));
```

- [ ] **Step 3: 파일 전체를 다시 읽어 함수/정책 순서와 문법을 확인**

`get_my_editable_account_book_ids()`가 `account_book_member` 테이블 및 `get_my_owned_account_book_ids()` 정의보다 아래(파일 앞부분 "1. SECURITY DEFINER 헬퍼 함수" 섹션 안)에 있는지, `category_select`/`category_write` 정책이 "3. RLS 정책" 섹션의 category 자리에 그대로 있는지 확인한다.

- [ ] **Step 4: Commit**

```bash
git add supabase_rls.sql
git commit -m "$(cat <<'EOF'
feat: category RLS를 가계부 단위 공유로 전환

get_my_editable_account_book_ids() 헬퍼를 추가하고, category_own(user_seq
전용) 정책을 category_select(가계부 멤버십 기준 SELECT)/category_write
(OWNER·EDITOR 권한 기준 쓰기)로 분리했다.

Signed-off-by: Seojeonguk <junguk7880@naver.com>
EOF
)"
```

---

### Task 3: `categoryApi`/`useCategories` 시그니처 변경 + 모든 호출부 갱신

이 태스크는 하나의 breaking change(“category 조회/생성 시 accountBookSeq가 필요”)와 그 모든 호출부를 함께 다룬다. 시그니처만 바꾸고 호출부를 안 바꾸면 `tsc --noEmit`이 즉시 실패하므로, 이 태스크는 끝까지 마쳐야 컴파일 가능한 상태가 된다.

**Files:**
- Modify: `src/entities/category/api/categoryApi.ts`
- Modify: `src/entities/category/model/useCategories.ts`
- Modify: `src/pages/category/ui/CategoryPage.tsx`
- Modify: `src/features/category/ui/CategoryCreateModal.tsx`
- Modify: `src/features/transaction/ui/TransactionCreateModal.tsx`
- Modify: `src/features/transaction/ui/TransactionEditModal.tsx`
- Modify: `src/features/transaction/ui/TransactionImportModal.tsx`
- Modify: `src/pages/budget/ui/BudgetPage.tsx`
- Modify: `src/pages/transaction/ui/TransactionPage.tsx`
- Modify: `src/pages/recurring/ui/RecurringPage.tsx`
- Modify: `src/entities/budget/api/budgetApi.ts`
- Modify: `src/features/auth/lib/guestMigration.ts`

**Interfaces:**
- Consumes: Task 1의 `category.account_book_seq` 컬럼 (타입 레벨에서는 무관하지만 의미상 전제).
- Produces:
  - `categoryApi.getCategories(accountBookSeq: number, type?: "INCOME" | "EXPENSE" | "TRANSFER"): Promise<CategoryListItemResponse[]>`
  - `categoryApi.createCategory(data: CategoryCreateRequest): Promise<CategoryListItemResponse>` where `CategoryCreateRequest = CategoryUpsertRequest & { accountBookSeq: number }`
  - `categoryApi.updateCategory(id: number, data: CategoryUpsertRequest): Promise<CategoryListItemResponse>` (시그니처 변경 없음)
  - `useCategories(accountBookSeq: number | null | undefined)` — 반환값 shape은 기존과 동일(`{ categories, loading, error, refetchCategories, deleteCategory }`).

- [ ] **Step 1: `categoryApi.ts` 수정**

`src/entities/category/api/categoryApi.ts` 전체를 아래 내용으로 교체한다:

```ts
import dayjs from "dayjs";
import { supabase } from "../../../shared/lib/supabase";
import { getUserSeq } from "../../../shared/lib/userSync";
import { guestMode } from "../../../shared/lib/guestMode";
import { guestStore } from "../../../shared/lib/guestStore";
import type { CategoryListItemResponse } from "../../transaction/api/category.types";

export interface CategoryUpsertRequest {
  name: string;
  description?: string;
  color?: string;
  type: "INCOME" | "EXPENSE";
}

export interface CategoryCreateRequest extends CategoryUpsertRequest {
  accountBookSeq: number;
}

const now = () => dayjs().format("YYYYMMDDHHmmss");

const categoryApi = {
  /** 가계부 내 카테고리 전체 목록 (배열 직접 반환) */
  getCategories: async (
    accountBookSeq: number,
    type?: "INCOME" | "EXPENSE" | "TRANSFER",
  ): Promise<CategoryListItemResponse[]> => {
    if (guestMode.isActive()) {
      const res = guestStore.getCategories(0, 1000, type);
      return res.categories ?? [];
    }

    // getUserSeq() 호출로 세션 유효성 확인 (RLS가 가계부 멤버십 기준으로 필터링)
    await getUserSeq();

    let query = supabase
      .from("category")
      .select("id, name, description, color, type")
      .eq("account_book_seq", accountBookSeq)
      .order("name");

    if (type) query = query.eq("type", type);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data ?? []).map((row: any) => ({
      id: row.id as number,
      name: row.name as string,
      description: row.description as string | undefined,
      color: row.color as string | undefined,
      type: row.type as "INCOME" | "EXPENSE",
    }));
  },

  createCategory: async (
    data: CategoryCreateRequest,
  ): Promise<CategoryListItemResponse> => {
    if (guestMode.isActive()) return guestStore.createCategory(data);

    const userSeq = await getUserSeq();
    const ts = now();

    const { data: row, error } = await supabase
      .from("category")
      .insert({
        name: data.name,
        description: data.description ?? null,
        color: data.color ?? null,
        type: data.type,
        user_seq: userSeq,
        account_book_seq: data.accountBookSeq,
        created_at: ts,
        updated_at: ts,
      })
      .select("id, name, description, color, type")
      .single();

    if (error || !row) throw new Error(error?.message ?? "카테고리 생성 실패");

    return {
      id: row.id as number,
      name: row.name as string,
      description: row.description as string | undefined,
      color: row.color as string | undefined,
      type: row.type as "INCOME" | "EXPENSE",
    };
  },

  updateCategory: async (
    id: number,
    data: CategoryUpsertRequest,
  ): Promise<CategoryListItemResponse> => {
    if (guestMode.isActive()) return guestStore.updateCategory(id, data);

    const { data: row, error } = await supabase
      .from("category")
      .update({
        name: data.name,
        description: data.description ?? null,
        color: data.color ?? null,
        type: data.type,
        updated_at: now(),
      })
      .eq("id", id)
      .select("id, name, description, color, type")
      .single();

    if (error || !row) throw new Error(error?.message ?? "카테고리 수정 실패");

    return {
      id: row.id as number,
      name: row.name as string,
      description: row.description as string | undefined,
      color: row.color as string | undefined,
      type: row.type as "INCOME" | "EXPENSE",
    };
  },

  deleteCategory: async (id: number, replacementId: number): Promise<void> => {
    if (guestMode.isActive()) { guestStore.deleteCategory(id, replacementId); return; }

    if (replacementId) {
      await supabase
        .from("transaction")
        .update({ category_seq: replacementId, updated_at: now() })
        .eq("category_seq", id);
    }

    const { error } = await supabase.from("category").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

export default categoryApi;
```

(`guestStore.createCategory`/`guestStore.getCategories`는 게스트 모드 전용 로컬 스토리지 구현이라 `accountBookSeq`를 쓰지 않는다 — `CategoryCreateRequest`가 `CategoryUpsertRequest`를 확장하므로 `guestStore.createCategory(data)`에 그대로 넘겨도 타입 에러 없이 컴파일된다. 확인만 하고 `guestStore.ts`는 수정하지 않는다.)

- [ ] **Step 2: `useCategories.ts` 수정**

`src/entities/category/model/useCategories.ts` 전체를 아래 내용으로 교체한다:

```ts
import { useCallback, useEffect, useState } from "react";
import categoryApi from "../api/categoryApi";
import type { CategoryListItemResponse } from "../../transaction/api/category.types";
import { getServerErrorMessage } from "../../../shared/lib/serverState";

export const useCategories = (accountBookSeq?: number | null) => {
  const [categories, setCategories] = useState<CategoryListItemResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    if (accountBookSeq == null) { setCategories([]); return; }

    setLoading(true);
    setError(null);

    try {
      const response = await categoryApi.getCategories(accountBookSeq);
      setCategories(response);
    } catch (nextError) {
      setError(
        getServerErrorMessage(
          nextError,
          "카테고리를 불러오는 중 오류가 발생했습니다.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [accountBookSeq]);

  const deleteCategory = useCallback(
    async (id: number, replacementId: number) => {
      try {
        await categoryApi.deleteCategory(id, replacementId);
        await fetchCategories();
      } catch (nextError) {
        throw new Error(
          getServerErrorMessage(
            nextError,
            "카테고리 삭제 중 오류가 발생했습니다.",
          ),
        );
      }
    },
    [fetchCategories],
  );

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    refetchCategories: fetchCategories,
    deleteCategory,
  };
};
```

- [ ] **Step 3: `CategoryPage.tsx` 수정**

`src/pages/category/ui/CategoryPage.tsx`에서:

```ts
const { categories, loading, error, refetchCategories, deleteCategory } = useCategories();
```

를 다음으로 바꾼다:

```ts
const { categories, loading, error, refetchCategories, deleteCategory } = useCategories(
  currentAccountBook?.id,
);
```

그리고 `<CategoryCreateModal>` 렌더 부분:

```tsx
<CategoryCreateModal
  isOpen={isCreateModalOpen}
  onClose={() => setIsCreateModalOpen(false)}
  onSuccess={refetchCategories}
/>
```

를 다음으로 바꾼다:

```tsx
<CategoryCreateModal
  isOpen={isCreateModalOpen}
  onClose={() => setIsCreateModalOpen(false)}
  onSuccess={refetchCategories}
  accountBookId={currentAccountBook?.id}
/>
```

(같은 파일 47-67줄의 카테고리별 거래 건수 집계 `useEffect`는 이미 `account_book_seq`로 필터링하고 있어 이번 변경과 무관하다 — 수정하지 않는다.)

- [ ] **Step 4: `CategoryCreateModal.tsx` 수정**

`src/features/category/ui/CategoryCreateModal.tsx`에서 import 라인:

```ts
import categoryApi from "../../../entities/category/api/categoryApi";
```

를 다음으로 바꾼다:

```ts
import categoryApi, { type CategoryCreateRequest } from "../../../entities/category/api/categoryApi";
```

props 인터페이스:

```ts
interface CategoryCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}
```

를 다음으로 바꾼다:

```ts
interface CategoryCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  accountBookId: number | null | undefined;
}
```

컴포넌트 구조분해 할당:

```ts
const CategoryCreateModal: React.FC<CategoryCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
```

를 다음으로 바꾼다:

```ts
const CategoryCreateModal: React.FC<CategoryCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  accountBookId,
}) => {
```

`handleSingleSubmit`:

```ts
const handleSingleSubmit = async () => {
  await categoryApi.createCategory({
    name,
    description: description || undefined,
    color: color || undefined,
    type: categoryType,
  });
  await onSuccess();
```

를 다음으로 바꾼다:

```ts
const handleSingleSubmit = async () => {
  if (!accountBookId) {
    setError("가계부를 먼저 선택해 주세요.");
    return;
  }

  const payload: CategoryCreateRequest = {
    name,
    description: description || undefined,
    color: color || undefined,
    type: categoryType,
    accountBookSeq: accountBookId,
  };
  await categoryApi.createCategory(payload);
  await onSuccess();
```

`handleBulkSubmit`:

```ts
const handleBulkSubmit = async () => {
  if (parsedBulkNames.length === 0) {
    setError("한 줄에 하나씩 카테고리 이름을 입력해 주세요.");
    return;
  }

  for (const categoryName of parsedBulkNames) {
    await categoryApi.createCategory({
      name: categoryName,
      color: getRandomColor(),
      type: categoryType,
    });
  }
  await onSuccess();
```

를 다음으로 바꾼다:

```ts
const handleBulkSubmit = async () => {
  if (parsedBulkNames.length === 0) {
    setError("한 줄에 하나씩 카테고리 이름을 입력해 주세요.");
    return;
  }
  if (!accountBookId) {
    setError("가계부를 먼저 선택해 주세요.");
    return;
  }

  for (const categoryName of parsedBulkNames) {
    await categoryApi.createCategory({
      name: categoryName,
      color: getRandomColor(),
      type: categoryType,
      accountBookSeq: accountBookId,
    });
  }
  await onSuccess();
```

- [ ] **Step 5: `TransactionCreateModal.tsx` 수정**

`src/features/transaction/ui/TransactionCreateModal.tsx`에서:

```ts
const res = await categoryApi.getCategories(undefined, undefined, type as "INCOME" | "EXPENSE" | "TRANSFER");
```

를 다음으로 바꾼다 (해당 `useEffect`가 이미 `currentAccountBook?.id`에 의존하고 있는지 확인하고, 없다면 의존성 배열에 추가):

```ts
if (!currentAccountBook?.id) { setCategories([]); return; }
const res = await categoryApi.getCategories(currentAccountBook.id, type as "INCOME" | "EXPENSE" | "TRANSFER");
```

이 코드가 들어있는 `useEffect`의 의존성 배열을 확인해 `currentAccountBook?.id`가 없다면 추가한다.

- [ ] **Step 6: `TransactionEditModal.tsx` 수정**

`src/features/transaction/ui/TransactionEditModal.tsx`에서 (88-98줄):

```ts
  // type 바뀔 때 카테고리 재조회
  useEffect(() => {
    if (!isOpen) { setCategories([]); return; }
    void (async () => {
      try {
        const res = await categoryApi.getCategories(undefined, undefined, type as "INCOME" | "EXPENSE" | "TRANSFER");
        setCategories(res ?? []);
      } catch (e) {
        if (axios.isAxiosError(e)) setError(e.message);
      }
    })();
  }, [isOpen, type]);
```

를 다음으로 바꾼다:

```ts
  // type 또는 가계부 바뀔 때 카테고리 재조회
  useEffect(() => {
    if (!isOpen || !currentAccountBook?.id) { setCategories([]); return; }
    void (async () => {
      try {
        const res = await categoryApi.getCategories(currentAccountBook.id, type as "INCOME" | "EXPENSE" | "TRANSFER");
        setCategories(res ?? []);
      } catch (e) {
        if (axios.isAxiosError(e)) setError(e.message);
      }
    })();
  }, [isOpen, type, currentAccountBook?.id]);
```

- [ ] **Step 7: `TransactionImportModal.tsx` 수정**

import 라인:

```ts
import categoryApi, {
  type CategoryUpsertRequest,
```

에 `CategoryCreateRequest`를 추가:

```ts
import categoryApi, {
  type CategoryUpsertRequest,
  type CategoryCreateRequest,
```

(정확한 원본 라인은 파일을 열어 나머지 import 구조를 확인한 뒤 그 형태에 맞춰 추가한다.)

카테고리 자동 매칭 부분:

```ts
      // 카테고리 자동 매칭
      try {
        const cats = await categoryApi.getCategories();
```

를 다음으로 바꾼다:

```ts
      // 카테고리 자동 매칭
      try {
        if (!currentAccountBook) throw new Error("가계부가 선택되지 않았습니다.");
        const cats = await categoryApi.getCategories(currentAccountBook.id);
```

카테고리 생성 부분:

```ts
  const handleCreateCategory = async (name: string) => {
    const type = newCatTypes[name] ?? "EXPENSE";
    setCreatingCats((prev) => new Set(prev).add(name));
    try {
      const req: CategoryUpsertRequest = { name, type, color: randomColor() };
      const created = await categoryApi.createCategory(req);
```

를 다음으로 바꾼다:

```ts
  const handleCreateCategory = async (name: string) => {
    if (!currentAccountBook) return;
    const type = newCatTypes[name] ?? "EXPENSE";
    setCreatingCats((prev) => new Set(prev).add(name));
    try {
      const req: CategoryCreateRequest = {
        name, type, color: randomColor(), accountBookSeq: currentAccountBook.id,
      };
      const created = await categoryApi.createCategory(req);
```

- [ ] **Step 8: `BudgetPage.tsx` 수정**

`src/pages/budget/ui/BudgetPage.tsx` 상단 import에 계정북 컨텍스트 훅을 추가한다:

```ts
import { useAccountBookContext } from "../../../entities/accountbook/model/AccountBookContext";
```

`export default function BudgetPage() {` 바로 아래, `useBudget()` 호출 다음 줄에 추가:

```ts
export default function BudgetPage() {
  const theme = useTheme();
  const { currentAccountBook } = useAccountBookContext();
  const {
    yearMonth, setYearMonth,
    summary, loading, error,
    upsertBudget, deleteBudget, copyFromMonth,
    totalBudget, totalActual, totalRatio,
  } = useBudget();
```

카테고리 조회 `useEffect`:

```ts
  useEffect(() => {
    categoryApi.getCategories(0, 100)
      .then((res) => setAllCategories(res ?? []))
      .catch(() => {});
  }, []);
```

를 다음으로 바꾼다:

```ts
  useEffect(() => {
    if (!currentAccountBook?.id) { setAllCategories([]); return; }
    categoryApi.getCategories(currentAccountBook.id)
      .then((res) => setAllCategories(res ?? []))
      .catch(() => {});
  }, [currentAccountBook?.id]);
```

- [ ] **Step 9: `TransactionPage.tsx` 수정**

`src/pages/transaction/ui/TransactionPage.tsx` 상단 import에 추가:

```ts
import { useAccountBookContext } from "../../../entities/accountbook/model/AccountBookContext";
```

`function TransactionPage() {` 본문 최상단에 추가:

```ts
function TransactionPage() {
  const theme = useTheme();
  const { currentAccountBook } = useAccountBookContext();
```

(기존에 이미 `theme`, `viewMode` 등을 선언하는 줄들이 있으므로, 그 사이 아무 곳에 `currentAccountBook` 선언을 추가하면 된다. 파일을 열어 실제 위치를 확인한다.)

카테고리 필터 목록 조회 `useEffect`:

```ts
  useEffect(() => {
    categoryApi.getCategories(0, 100)
      .then((res) => setFilterCategories(res ?? []))
      .catch(() => { /* 조용히 실패 */ });
  }, []);
```

를 다음으로 바꾼다:

```ts
  useEffect(() => {
    if (!currentAccountBook?.id) { setFilterCategories([]); return; }
    categoryApi.getCategories(currentAccountBook.id)
      .then((res) => setFilterCategories(res ?? []))
      .catch(() => { /* 조용히 실패 */ });
  }, [currentAccountBook?.id]);
```

- [ ] **Step 10: `RecurringPage.tsx` 수정**

`src/pages/recurring/ui/RecurringPage.tsx`에서:

```ts
  useEffect(() => {
    categoryApi.getCategories(0, 100)
      .then((res) => setCategories(res ?? []))
      .catch(() => {});
  }, []);
```

를 다음으로 바꾼다 (이미 54줄에서 `accountBookSeq`를 `useRecurring()`으로부터 구조분해하고 있으므로 그대로 사용):

```ts
  useEffect(() => {
    if (!accountBookSeq) { setCategories([]); return; }
    categoryApi.getCategories(accountBookSeq)
      .then((res) => setCategories(res ?? []))
      .catch(() => {});
  }, [accountBookSeq]);
```

- [ ] **Step 11: `budgetApi.ts`의 `getBudgetSummary` 카테고리 조회 수정**

`src/entities/budget/api/budgetApi.ts`에서:

```ts
    const userSeq = await getUserSeq();

    // 해당 월 예산 조회
    const { data: budgets, error: budgetErr } = await supabase
      .from("budget")
      .select("id, category_seq, setting_day, amount")
      .eq("account_book_seq", accountBookSeq)
      .eq("setting_day", yearMonth);

    if (budgetErr) throw new Error(budgetErr.message);

    // 카테고리 전체 조회
    const { data: categories, error: catErr } = await supabase
      .from("category")
      .select("id, name, color, type")
      .eq("user_seq", userSeq);
```

를 다음으로 바꾼다 (`userSeq`는 이 함수 안에서 더 이상 쓰이지 않으므로 `getUserSeq()` 호출 자체를 세션 유효성 확인 용도로 남기고 변수 할당을 제거):

```ts
    // getUserSeq() 호출로 세션 유효성 확인 (카테고리도 이제 가계부 단위로 조회)
    await getUserSeq();

    // 해당 월 예산 조회
    const { data: budgets, error: budgetErr } = await supabase
      .from("budget")
      .select("id, category_seq, setting_day, amount")
      .eq("account_book_seq", accountBookSeq)
      .eq("setting_day", yearMonth);

    if (budgetErr) throw new Error(budgetErr.message);

    // 카테고리 전체 조회 (가계부 단위 공유)
    const { data: categories, error: catErr } = await supabase
      .from("category")
      .select("id, name, color, type")
      .eq("account_book_seq", accountBookSeq);
```

- [ ] **Step 12: `guestMigration.ts`의 `createCategory` 호출에 `accountBookSeq` 추가**

`src/features/auth/lib/guestMigration.ts`에서:

```ts
      const serverCat = await categoryApi.createCategory({
        name: cat.name,
        description: cat.description,
        color: cat.color ?? undefined,
      });
```

를 다음으로 바꾼다:

```ts
      const serverCat = await categoryApi.createCategory({
        name: cat.name,
        description: cat.description,
        color: cat.color ?? undefined,
        type: cat.type,
        accountBookSeq: serverAccountBookId,
      });
```

(`cat.type`이 이미 게스트 카테고리 객체에 있는지 확인 — `guestStore.getCategories`가 반환하는 `CategoryListItemResponse`에는 `type: "INCOME" | "EXPENSE" | "TRANSFER"` 필드가 있으므로 `CategoryUpsertRequest.type`(`"INCOME" | "EXPENSE"`)과 타입이 안 맞을 수 있다. 기존 코드가 `type`을 아예 안 넘기고 있었다는 것은 `categoryApi.createCategory`의 이전 시그니처에서 `type`이 필수 필드였는데도 안 넘긴 것이므로, 실제로는 타입 에러가 있었거나 `cat.type`이 이미 `"INCOME" | "EXPENSE"`로 좁혀져 있을 것이다 — 이 Step을 진행하며 실제 타입 에러가 나면 `type: cat.type as "INCOME" | "EXPENSE"`로 캐스팅한다.)

- [ ] **Step 13: 타입 체크 실행**

Run: `npx tsc --noEmit`
Expected: 에러 0건 (기존에도 0건이었음 — 이 태스크로 새로 발생하는 타입 에러가 없어야 함).

에러가 나면 Step 5~12에서 실제 파일 구조와 어긋난 부분(예: `useEffect` 의존성 배열 실제 위치, `currentAccountBook` 변수가 이미 있는지 여부)을 다시 확인해 맞춰 수정한다.

- [ ] **Step 14: Lint 실행 및 베이스라인 비교**

Run: `npm run lint 2>&1 | tail -3`
Expected: `✖ 208 problems (179 errors, 29 warnings)`와 같거나 더 적은 숫자 (새로 만든 `any` 사용은 기존 `categoryApi.ts` 패턴과 동일하므로 문제 개수가 늘지 않아야 한다).

- [ ] **Step 15: Commit**

```bash
git add src/entities/category/api/categoryApi.ts \
        src/entities/category/model/useCategories.ts \
        src/pages/category/ui/CategoryPage.tsx \
        src/features/category/ui/CategoryCreateModal.tsx \
        src/features/transaction/ui/TransactionCreateModal.tsx \
        src/features/transaction/ui/TransactionEditModal.tsx \
        src/features/transaction/ui/TransactionImportModal.tsx \
        src/pages/budget/ui/BudgetPage.tsx \
        src/pages/transaction/ui/TransactionPage.tsx \
        src/pages/recurring/ui/RecurringPage.tsx \
        src/entities/budget/api/budgetApi.ts \
        src/features/auth/lib/guestMigration.ts
git commit -m "$(cat <<'EOF'
feat: 카테고리 조회/생성을 가계부 단위로 전환

categoryApi.getCategories/createCategory가 accountBookSeq를 받도록
시그니처를 바꾸고, useCategories 훅과 8개 호출부(카테고리 관리, 거래
생성/수정/가져오기, 예산, 반복거래 페이지)를 모두 가계부 컨텍스트
기준으로 갱신했다. budgetApi.getBudgetSummary의 카테고리 조회도
account_book_seq 기준으로 변경.

Signed-off-by: Seojeonguk <junguk7880@naver.com>
EOF
)"
```

---

### Task 4: 기본 데이터 시딩 리팩터 — `seedAccountBookDefaults`

**Files:**
- Modify: `src/shared/lib/userSync.ts`
- Modify: `src/entities/accountbook/api/accountBookApi.ts`

**Interfaces:**
- Consumes: Task 3의 `categoryApi`는 직접 쓰지 않음(이 태스크는 Supabase에 직접 insert). Task 1의 `category.account_book_seq` 컬럼 사용.
- Produces: `seedAccountBookDefaults(accountBookId: number, userId: number, options?: { includeCategories?: boolean }): Promise<void>` (from `shared/lib/userSync.ts`, named export). `accountBookApi.createAccountBook(name: string, opts?: { seedDefaultCategories?: boolean }): Promise<AccountBookCreateResponse>` — Task 5가 `opts.seedDefaultCategories: false`를 사용한다.

- [ ] **Step 1: `userSync.ts`에 `seedAccountBookDefaults` 추가**

`src/shared/lib/userSync.ts`에서 `ensureDefaultData` 함수 정의 바로 앞에 새 함수를 추가한다:

```ts
/**
 * 신규 가계부에 기본 분류(INCOME/EXPENSE/TRANSFER)와, 옵션에 따라 기본
 * 카테고리 9종을 시딩한다. 이미 데이터가 있는 가계부에 대한 "보완"이
 * 아니라 방금 만든 빈 가계부를 채우는 용도이므로 존재 여부를 확인하지
 * 않고 바로 insert한다.
 */
export async function seedAccountBookDefaults(
  accountBookId: number,
  userId: number,
  options?: { includeCategories?: boolean },
): Promise<void> {
  const now = dayjs().format("YYYYMMDDHHmmss");

  const { error: classErr } = await supabase.from("classification").insert(
    (["INCOME", "EXPENSE", "TRANSFER"] as const).map((name) => ({
      name,
      account_book_seq: accountBookId,
      created_at: now,
      updated_at: now,
    })),
  );
  if (classErr) throw new Error("분류 생성 실패: " + classErr.message);

  if (options?.includeCategories === false) return;

  const { error: catErr } = await supabase.from("category").insert(
    DEFAULT_CATEGORIES.map((c) => ({
      ...c,
      user_seq: userId,
      account_book_seq: accountBookId,
      created_at: now,
      updated_at: now,
    })),
  );
  if (catErr) throw new Error("카테고리 생성 실패: " + catErr.message);
}
```

- [ ] **Step 2: `doSyncUser`의 신규 유저 분기를 `seedAccountBookDefaults` 사용으로 교체**

같은 파일의 `doSyncUser` 함수에서:

```ts
  // 기본 분류 생성 (INCOME / EXPENSE / TRANSFER)
  const { error: classErr } = await supabase.from("classification").insert([
    {
      name: "INCOME",
      account_book_seq: book.id,
      created_at: now,
      updated_at: now,
    },
    {
      name: "EXPENSE",
      account_book_seq: book.id,
      created_at: now,
      updated_at: now,
    },
    {
      name: "TRANSFER",
      account_book_seq: book.id,
      created_at: now,
      updated_at: now,
    },
  ]);

  if (classErr) throw new Error("분류 생성 실패: " + classErr.message);

  // 기본 카테고리 생성
  const { error: catErr } = await supabase.from("category").insert(
    DEFAULT_CATEGORIES.map((c) => ({
      ...c,
      user_seq: userId,
      created_at: now,
      updated_at: now,
    })),
  );

  if (catErr) throw new Error("카테고리 생성 실패: " + catErr.message);

  cachedUserSeq = userId;
```

를 다음으로 바꾼다:

```ts
  // 기본 분류 + 기본 카테고리 생성
  await seedAccountBookDefaults(book.id as number, userId);

  cachedUserSeq = userId;
```

(이 블록 위쪽에서 `const now = dayjs().format("YYYYMMDDHHmmss");`가 `account_book` insert보다 먼저 선언되어 있고 그 이후에도 쓰이므로 `now` 선언 자체는 그대로 둔다 — `seedAccountBookDefaults`는 내부에서 자신만의 `now`를 새로 계산하므로 외부 `now`와 무관하다.)

- [ ] **Step 3: `ensureDefaultData`의 카테고리 존재 체크를 `account_book_seq` 기준으로 변경**

같은 파일의 `ensureDefaultData`에서:

```ts
  // 기본 카테고리 보완 — 카테고리가 하나라도 있으면 스킵 (사용자 커스텀 보호)
  const { count: catCount } = await supabase
    .from("category")
    .select("*", { count: "exact", head: true })
    .eq("user_seq", userId);

  if ((catCount ?? 0) === 0) {
    await supabase.from("category").insert(
      DEFAULT_CATEGORIES.map((c) => ({ ...c, user_seq: userId, created_at: now, updated_at: now })),
    );
  }
```

를 다음으로 바꾼다:

```ts
  // 기본 카테고리 보완 — 해당 가계부에 카테고리가 하나라도 있으면 스킵 (커스텀 보호)
  const { count: catCount } = await supabase
    .from("category")
    .select("*", { count: "exact", head: true })
    .eq("account_book_seq", accountBookId);

  if ((catCount ?? 0) === 0) {
    await supabase.from("category").insert(
      DEFAULT_CATEGORIES.map((c) => ({
        ...c, user_seq: userId, account_book_seq: accountBookId, created_at: now, updated_at: now,
      })),
    );
  }
```

- [ ] **Step 4: `accountBookApi.createAccountBook`에 시딩 옵션 추가**

`src/entities/accountbook/api/accountBookApi.ts`에서 import 라인에 추가:

```ts
import { getUserSeq, seedAccountBookDefaults } from "../../../shared/lib/userSync";
```

`createAccountBook` 함수:

```ts
  createAccountBook: async (name: string): Promise<AccountBookCreateResponse> => {
    const userSeq = await getUserSeq();
    const now = dayjs().format("YYYYMMDDHHmmss");

    const { data: book, error: bookErr } = await supabase
      .from("account_book")
      .insert({
        name,
        created_at: now,
        created_by: userSeq,
        updated_at: now,
        updated_by: userSeq,
      })
      .select("id, name, updated_at")
      .single();

    if (bookErr || !book) throw new Error(bookErr?.message ?? "가계부 생성 실패");

    await supabase.from("account_book_member").insert({
      account_book_id: book.id,
      user_id: userSeq,
      authority: "OWNER",
      is_available: "Y",
      created_at: now,
      created_by: userSeq,
      updated_at: now,
      updated_by: userSeq,
    });

    return {
      id: book.id as number,
      name: book.name as string,
      updatedAt: book.updated_at as string,
    };
  },
```

를 다음으로 바꾼다:

```ts
  createAccountBook: async (
    name: string,
    opts?: { seedDefaultCategories?: boolean },
  ): Promise<AccountBookCreateResponse> => {
    const userSeq = await getUserSeq();
    const now = dayjs().format("YYYYMMDDHHmmss");

    const { data: book, error: bookErr } = await supabase
      .from("account_book")
      .insert({
        name,
        created_at: now,
        created_by: userSeq,
        updated_at: now,
        updated_by: userSeq,
      })
      .select("id, name, updated_at")
      .single();

    if (bookErr || !book) throw new Error(bookErr?.message ?? "가계부 생성 실패");

    await supabase.from("account_book_member").insert({
      account_book_id: book.id,
      user_id: userSeq,
      authority: "OWNER",
      is_available: "Y",
      created_at: now,
      created_by: userSeq,
      updated_at: now,
      updated_by: userSeq,
    });

    await seedAccountBookDefaults(book.id as number, userSeq, {
      includeCategories: opts?.seedDefaultCategories ?? true,
    });

    return {
      id: book.id as number,
      name: book.name as string,
      updatedAt: book.updated_at as string,
    };
  },
```

- [ ] **Step 5: 타입 체크 + lint 실행**

Run: `npx tsc --noEmit`
Expected: 에러 0건.

Run: `npm run lint 2>&1 | tail -3`
Expected: 208개 이하.

- [ ] **Step 6: Commit**

```bash
git add src/shared/lib/userSync.ts src/entities/accountbook/api/accountBookApi.ts
git commit -m "$(cat <<'EOF'
refactor: 가계부 기본 데이터 시딩을 seedAccountBookDefaults로 통합

신규 유저 가입 시 기본 가계부에 분류/카테고리를 시딩하던 인라인 코드와,
가계부를 추가로 만들 때 시딩이 아예 없던 구멍(과거엔 카테고리가 전역
이라 문제 없었지만 가계부 단위로 바뀐 지금은 필요)을 seedAccountBookDefaults()
공용 함수로 합쳤다. createAccountBook에 seedDefaultCategories 옵션을 추가해
호출부가 기본 카테고리 시딩 여부를 선택할 수 있게 했다(다음 커밋에서
게스트 마이그레이션이 이 옵션을 사용).

Signed-off-by: Seojeonguk <junguk7880@naver.com>
EOF
)"
```

---

### Task 5: 게스트 마이그레이션 기본 카테고리 중복 방지

**Files:**
- Modify: `src/features/auth/lib/guestMigration.ts`

**Interfaces:**
- Consumes: Task 4의 `accountBookApi.createAccountBook(name, { seedDefaultCategories: false })`.

- [ ] **Step 1: `createAccountBook` 호출에 옵션 추가**

`src/features/auth/lib/guestMigration.ts`에서:

```ts
  const accountBook = await accountBookApi.createAccountBook("나의 가계부");
```

를 다음으로 바꾼다:

```ts
  // 게스트가 직접 만든 카테고리를 그대로 업로드하므로 기본 카테고리는 시딩하지 않는다
  const accountBook = await accountBookApi.createAccountBook("나의 가계부", {
    seedDefaultCategories: false,
  });
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 0건.

- [ ] **Step 3: Commit**

```bash
git add src/features/auth/lib/guestMigration.ts
git commit -m "$(cat <<'EOF'
fix: 게스트 회원 전환 시 기본 카테고리 중복 생성 방지

createAccountBook이 이제 기본적으로 기본 카테고리를 시딩하므로, 게스트가
직접 만든 카테고리를 그대로 업로드하는 이 흐름에서는 seedDefaultCategories:
false로 시딩을 건너뛰도록 했다.

Signed-off-by: Seojeonguk <junguk7880@naver.com>
EOF
)"
```

---

### Task 6: 전체 검증 및 수동 QA 체크리스트

**Files:**
- (변경 없음 — 검증 전용 태스크)

- [ ] **Step 1: 전체 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 0건.

- [ ] **Step 2: 전체 lint 재확인**

Run: `npm run lint 2>&1 | tail -3`
Expected: Task 1~5 이전과 동일하거나 더 적은 문제 수(브랜치 시작 시점 베이스라인: 208개).

- [ ] **Step 3: `git diff`로 전체 변경 사항 재검토**

Run: `git log --oneline fix/account-book-shared-visibility..HEAD` 및 `git diff <이 작업 시작 커밋>..HEAD --stat`으로 의도한 파일만 바뀌었는지 확인.

- [ ] **Step 4: 사용자에게 안내할 수동 QA 체크리스트 정리 (실행은 DB 마이그레이션 적용 후 사용자가 수행)**

아래 항목을 사용자에게 전달한다 (자동 테스트 프레임워크가 없고, 여러 실제 계정/권한 조합이 필요해 이 작업을 수행하는 에이전트가 직접 실행할 수 없음):

1. Supabase 대시보드에서 `supabase_migration_category_account_book_scope.sql` 실행 → 기존 카테고리들이 `account_book_seq`를 갖게 됐는지 SQL로 확인 (`SELECT COUNT(*) FROM category WHERE account_book_seq IS NULL;`가 0 또는 예상 가능한 소수인지).
2. `supabase_rls.sql` 재실행 (category_select/category_write 정책 반영).
3. 기존 계정으로 로그인 → 카테고리 관리 페이지에서 카테고리 목록이 마이그레이션 전과 동일하게 보이는지.
4. "가계부 추가"로 새 가계부 생성 → 카테고리 관리 페이지 전환 후 기본 카테고리 9개 + 분류 3종이 바로 보이는지.
5. 다른 계정을 EDITOR로 초대 → 그 계정으로 로그인해 OWNER가 만든 카테고리가 보이는지, 새 카테고리를 만들 수 있는지.
6. 같은 계정을 VIEWER로 강등 → 카테고리 생성 시도 시 에러가 나는지(또는 UI에서 막히는지).
7. 게스트 모드에서 카테고리를 하나 추가/이름 변경한 뒤 회원가입으로 전환 → 기본 카테고리 9개가 중복 생성되지 않고 게스트가 만든 카테고리만 올라갔는지.
8. 예산 페이지에서 카테고리별 실사용액이 가계부 전체 거래 기준으로 집계되는지.

이 체크리스트를 사용자에게 전달하는 것으로 Task 6을 마친다 (커밋 없음).

---

## Self-Review 결과

- **Spec coverage:** 스펙의 1(스키마)/2(RLS)/3(앱 코드)/4(시딩 리팩터+게스트 예외)/5(테스트 계획) 섹션이 각각 Task 1/2/3/4~5/6에 대응됨. 스펙의 "리스크" 섹션(`ensureDefaultData`의 `memberships[0]` 한계)은 의도적으로 손대지 않기로 명시했으므로 별도 태스크 없음 — 문서화로 충분.
- **Placeholder scan:** 전 태스크에 실제 코드 스니펫 포함, "TODO"/"similar to Task N" 없음.
- **Type consistency:** `CategoryCreateRequest`(Task 3 Step 1에서 정의) → Task 3 Step 4/7, Task 5에서 동일 이름으로 사용. `seedAccountBookDefaults`(Task 4 Step 1에서 정의) → Step 2/4에서 동일 시그니처로 사용. `createAccountBook(name, opts?)`(Task 4 Step 4) → Task 5에서 동일 옵션 키(`seedDefaultCategories`)로 사용됨을 확인.
