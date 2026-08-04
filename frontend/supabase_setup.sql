-- ============================================================
-- Sodam - Supabase 전체 셋업 스크립트
-- Supabase 대시보드 > SQL Editor에서 순서대로 실행하세요.
-- ============================================================


-- ══════════════════════════════════════════════════════════════
-- 1. 테이블 생성
-- ══════════════════════════════════════════════════════════════

-- 유저
CREATE TABLE IF NOT EXISTS public.users (
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR(255) UNIQUE,
    name          VARCHAR(255),
    password      VARCHAR(255),
    image_url     VARCHAR(255),
    auth_provider VARCHAR(255),
    provider_id   VARCHAR(255),
    role          VARCHAR(255)
);

-- 가계부
CREATE TABLE IF NOT EXISTS public.account_book (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(255),
    created_at VARCHAR(14) NOT NULL,
    created_by BIGINT,
    updated_at VARCHAR(14) NOT NULL,
    updated_by BIGINT
);

-- 가계부 멤버
CREATE TABLE IF NOT EXISTS public.account_book_member (
    id              BIGSERIAL PRIMARY KEY,
    account_book_id BIGINT,
    user_id         BIGINT,
    authority       VARCHAR(255),   -- OWNER | EDITOR | VIEWER
    is_available    VARCHAR(255),
    available_from  VARCHAR(14),
    available_to    VARCHAR(14),
    created_at      VARCHAR(14) NOT NULL,
    created_by      BIGINT,
    updated_at      VARCHAR(14) NOT NULL,
    updated_by      BIGINT
);

CREATE INDEX IF NOT EXISTS idx_abm_account_book_id ON public.account_book_member(account_book_id);
CREATE INDEX IF NOT EXISTS idx_abm_user_id         ON public.account_book_member(user_id);

-- 거래
CREATE TABLE IF NOT EXISTS public.transaction (
    seq              BIGSERIAL PRIMARY KEY,
    account_book_seq BIGINT,
    user_seq         BIGINT,
    category_seq     BIGINT,
    amount           DECIMAL(19,2) NOT NULL,
    description      VARCHAR(255),
    transaction_date VARCHAR(14)   NOT NULL,  -- YYYYMMDDHHmmss
    type             VARCHAR(20)   NOT NULL,  -- INCOME | EXPENSE
    satisfaction_rating INT,
    created_at       VARCHAR(14)   NOT NULL,
    updated_at       VARCHAR(14)   NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transaction_account_book_seq ON public.transaction(account_book_seq);
CREATE INDEX IF NOT EXISTS idx_transaction_user_seq         ON public.transaction(user_seq);
CREATE INDEX IF NOT EXISTS idx_transaction_category_seq     ON public.transaction(category_seq);
CREATE INDEX IF NOT EXISTS idx_transaction_date             ON public.transaction(transaction_date);

-- 카테고리
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

-- 분류 (Classification)
CREATE TABLE IF NOT EXISTS public.classification (
    id               BIGSERIAL PRIMARY KEY,
    name             VARCHAR(255),
    account_book_seq BIGINT,
    created_at       VARCHAR(14) NOT NULL,
    updated_at       VARCHAR(14) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_classification_account_book_seq ON public.classification(account_book_seq);

-- 예산
CREATE TABLE IF NOT EXISTS public.budget (
    id               BIGSERIAL PRIMARY KEY,
    account_book_seq BIGINT        NOT NULL,
    user_seq         BIGINT        NOT NULL,
    category_seq     BIGINT,
    setting_day      VARCHAR(6)    NOT NULL,  -- YYYYMM
    amount           DECIMAL(19,2) NOT NULL,
    created_at       VARCHAR(14)   NOT NULL,
    updated_at       VARCHAR(14)   NOT NULL,
    CONSTRAINT uk_budget UNIQUE (account_book_seq, category_seq, setting_day)
);

CREATE INDEX IF NOT EXISTS idx_budget_account_book ON public.budget(account_book_seq);
CREATE INDEX IF NOT EXISTS idx_budget_user         ON public.budget(user_seq);
CREATE INDEX IF NOT EXISTS idx_budget_setting_day  ON public.budget(setting_day);

-- 반복 거래
CREATE TABLE IF NOT EXISTS public.recurring_transaction (
    id               BIGSERIAL PRIMARY KEY,
    account_book_seq BIGINT        NOT NULL,
    user_seq         BIGINT        NOT NULL,
    category_seq     BIGINT,
    amount           DECIMAL(19,2) NOT NULL,
    description      VARCHAR(255),
    type             VARCHAR(20)   NOT NULL,  -- INCOME | EXPENSE
    day_of_month     INT           NOT NULL,  -- 1~31
    is_active        BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at       VARCHAR(14)   NOT NULL,
    updated_at       VARCHAR(14)   NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recurring_account_book ON public.recurring_transaction(account_book_seq);
CREATE INDEX IF NOT EXISTS idx_recurring_user         ON public.recurring_transaction(user_seq);


-- ══════════════════════════════════════════════════════════════
-- 2. RLS 헬퍼 함수
--    현재 Supabase Auth 유저의 public.users.id(BIGSERIAL) 반환
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_my_user_seq()
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM public.users WHERE email = auth.email()
$$;


-- ══════════════════════════════════════════════════════════════
-- 3. RLS 활성화
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.users                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_book          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_book_member   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_transaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classification        ENABLE ROW LEVEL SECURITY;


-- ══════════════════════════════════════════════════════════════
-- 4. RLS 정책
-- ══════════════════════════════════════════════════════════════

-- ── users ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "users_self" ON public.users;
CREATE POLICY "users_self" ON public.users
  FOR ALL
  USING     (email = auth.email())
  WITH CHECK (email = auth.email());

-- ── account_book ─────────────────────────────────────────────
DROP POLICY IF EXISTS "account_book_access" ON public.account_book;
CREATE POLICY "account_book_access" ON public.account_book
  FOR ALL
  USING (
    id IN (
      SELECT account_book_id
      FROM public.account_book_member
      WHERE user_id = public.get_my_user_seq()
    )
  );

-- ── account_book_member: 조회 ─────────────────────────────────
DROP POLICY IF EXISTS "abm_select" ON public.account_book_member;
CREATE POLICY "abm_select" ON public.account_book_member
  FOR SELECT
  USING (
    account_book_id IN (
      SELECT account_book_id
      FROM public.account_book_member
      WHERE user_id = public.get_my_user_seq()
    )
  );

-- ── account_book_member: 추가 ─────────────────────────────────
DROP POLICY IF EXISTS "abm_insert" ON public.account_book_member;
CREATE POLICY "abm_insert" ON public.account_book_member
  FOR INSERT
  WITH CHECK (
    account_book_id IN (
      SELECT account_book_id
      FROM public.account_book_member
      WHERE user_id = public.get_my_user_seq()
    )
  );

-- ── account_book_member: 수정/삭제 (OWNER만) ─────────────────
DROP POLICY IF EXISTS "abm_update" ON public.account_book_member;
CREATE POLICY "abm_update" ON public.account_book_member
  FOR UPDATE
  USING (
    account_book_id IN (
      SELECT account_book_id
      FROM public.account_book_member
      WHERE user_id = public.get_my_user_seq()
        AND authority = 'OWNER'
    )
  );

DROP POLICY IF EXISTS "abm_delete" ON public.account_book_member;
CREATE POLICY "abm_delete" ON public.account_book_member
  FOR DELETE
  USING (
    account_book_id IN (
      SELECT account_book_id
      FROM public.account_book_member
      WHERE user_id = public.get_my_user_seq()
        AND authority = 'OWNER'
    )
  );

-- ── transaction ───────────────────────────────────────────────
DROP POLICY IF EXISTS "transaction_own" ON public.transaction;
CREATE POLICY "transaction_own" ON public.transaction
  FOR ALL
  USING     (user_seq = public.get_my_user_seq())
  WITH CHECK (user_seq = public.get_my_user_seq());

-- ── budget ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "budget_own" ON public.budget;
CREATE POLICY "budget_own" ON public.budget
  FOR ALL
  USING     (user_seq = public.get_my_user_seq())
  WITH CHECK (user_seq = public.get_my_user_seq());

-- ── recurring_transaction ─────────────────────────────────────
DROP POLICY IF EXISTS "recurring_own" ON public.recurring_transaction;
CREATE POLICY "recurring_own" ON public.recurring_transaction
  FOR ALL
  USING     (user_seq = public.get_my_user_seq())
  WITH CHECK (user_seq = public.get_my_user_seq());

-- ── category ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "category_own" ON public.category;
CREATE POLICY "category_own" ON public.category
  FOR ALL
  USING     (user_seq = public.get_my_user_seq())
  WITH CHECK (user_seq = public.get_my_user_seq());

-- ── classification ────────────────────────────────────────────
DROP POLICY IF EXISTS "classification_abm" ON public.classification;
CREATE POLICY "classification_abm" ON public.classification
  FOR ALL
  USING (
    account_book_seq IN (
      SELECT account_book_id
      FROM public.account_book_member
      WHERE user_id = public.get_my_user_seq()
    )
  );


-- ══════════════════════════════════════════════════════════════
-- 완료!
-- ══════════════════════════════════════════════════════════════
