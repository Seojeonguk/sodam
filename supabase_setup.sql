-- ============================================================
-- Sodam - 테이블 & 인덱스 생성 스크립트
-- 실행 순서: 1) 이 파일 → 2) supabase_rls.sql
-- Supabase 대시보드 > SQL Editor
-- ============================================================


-- ── users ────────────────────────────────────────────────────
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


-- ── account_book ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.account_book (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(255),
    created_at VARCHAR(14) NOT NULL,
    created_by BIGINT,
    updated_at VARCHAR(14) NOT NULL,
    updated_by BIGINT
);


-- ── account_book_member ───────────────────────────────────────
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
    updated_by      BIGINT,
    CONSTRAINT uk_account_book_member UNIQUE (account_book_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_abm_account_book_id ON public.account_book_member(account_book_id);
CREATE INDEX IF NOT EXISTS idx_abm_user_id         ON public.account_book_member(user_id);


-- ── transaction ───────────────────────────────────────────────
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


-- ── classification ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.classification (
    id               BIGSERIAL PRIMARY KEY,
    name             VARCHAR(255),
    account_book_seq BIGINT,
    created_at       VARCHAR(14) NOT NULL,
    updated_at       VARCHAR(14) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_classification_account_book_seq ON public.classification(account_book_seq);


-- ── budget ────────────────────────────────────────────────────
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


-- ── recurring_transaction ─────────────────────────────────────
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


-- ── pending_invites ──────────────────────────────────────────
-- 미가입 사용자 초대 보류 테이블
-- 초대받은 이메일로 가입 후 로그인 시 자동으로 멤버 추가
CREATE TABLE IF NOT EXISTS public.pending_invites (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    account_book_id BIGINT       NOT NULL REFERENCES public.account_book(id) ON DELETE CASCADE,
    invited_email   VARCHAR(255) NOT NULL,
    authority       VARCHAR(50)  NOT NULL DEFAULT 'EDITOR',
    invited_by      BIGINT       NOT NULL,
    created_at      VARCHAR(14)  NOT NULL,
    expires_at      VARCHAR(14)  NOT NULL   -- 7일 후 만료
);

CREATE INDEX IF NOT EXISTS idx_pending_invites_email   ON public.pending_invites(invited_email);
CREATE INDEX IF NOT EXISTS idx_pending_invites_book    ON public.pending_invites(account_book_id);


-- ── asset ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.asset (
    seq              BIGSERIAL PRIMARY KEY,
    account_book_seq BIGINT        NOT NULL,
    user_seq         BIGINT        NOT NULL,
    name             VARCHAR(255)  NOT NULL,
    type             VARCHAR(20)   NOT NULL DEFAULT 'BANK',  -- BANK | CARD | CASH | INVESTMENT | POINT
    balance          BIGINT        NOT NULL DEFAULT 0,
    note             VARCHAR(255),
    color            VARCHAR(50),
    is_available     CHAR(1)       NOT NULL DEFAULT 'Y',
    created_at       VARCHAR(14)   NOT NULL,
    updated_at       VARCHAR(14)   NOT NULL,
    created_by       BIGINT        NOT NULL,
    updated_by       BIGINT        NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_asset_account_book ON public.asset(account_book_seq);
CREATE INDEX IF NOT EXISTS idx_asset_user         ON public.asset(user_seq);


-- ── asset_history ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.asset_history (
    seq             BIGSERIAL PRIMARY KEY,
    asset_seq       BIGINT        NOT NULL REFERENCES public.asset(seq) ON DELETE CASCADE,
    balance         BIGINT        NOT NULL,
    delta           BIGINT        NOT NULL DEFAULT 0,
    source          VARCHAR(20)   NOT NULL DEFAULT 'MANUAL',  -- MANUAL | TRANSACTION
    transaction_seq BIGINT,
    note            VARCHAR(255),
    recorded_at     VARCHAR(14)   NOT NULL,
    created_at      VARCHAR(14)   NOT NULL,
    created_by      BIGINT        NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_asset_history_asset_seq ON public.asset_history(asset_seq);


-- ── transaction.asset_seq 컬럼 추가 ──────────────────────────
ALTER TABLE public.transaction
  ADD COLUMN IF NOT EXISTS asset_seq BIGINT REFERENCES public.asset(seq) ON DELETE SET NULL;


-- ══════════════════════════════════════════════════════════════
-- 완료! 다음 단계: supabase_rls.sql 실행
-- ══════════════════════════════════════════════════════════════
