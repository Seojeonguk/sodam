-- ======================================================
-- sodam-app 통합 초기 스키마 (PostgreSQL / Supabase)
-- ======================================================

-- 유저
CREATE TABLE IF NOT EXISTS users (
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
CREATE TABLE IF NOT EXISTS account_book (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(255),
    created_at VARCHAR(14) NOT NULL,
    created_by BIGINT,
    updated_at VARCHAR(14) NOT NULL,
    updated_by BIGINT
);

-- 가계부 멤버
CREATE TABLE IF NOT EXISTS account_book_member (
    id              BIGSERIAL PRIMARY KEY,
    account_book_id BIGINT,
    user_id         BIGINT,
    authority       VARCHAR(255),
    is_available    VARCHAR(255),
    available_from  VARCHAR(14),
    available_to    VARCHAR(14),
    created_at      VARCHAR(14) NOT NULL,
    created_by      BIGINT,
    updated_at      VARCHAR(14) NOT NULL,
    updated_by      BIGINT
);

CREATE INDEX IF NOT EXISTS idx_abm_account_book_id ON account_book_member(account_book_id);
CREATE INDEX IF NOT EXISTS idx_abm_user_id ON account_book_member(user_id);

-- 거래
CREATE TABLE IF NOT EXISTS transaction (
    seq              BIGSERIAL PRIMARY KEY,
    account_book_seq BIGINT,
    user_seq         BIGINT,
    category_seq     BIGINT,
    amount           DECIMAL(19,2) NOT NULL,
    description      VARCHAR(255),
    transaction_date VARCHAR(14) NOT NULL,
    type             VARCHAR(20) NOT NULL,
    satisfaction_rating INT,
    created_at       VARCHAR(14) NOT NULL,
    updated_at       VARCHAR(14) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transaction_account_book_seq ON transaction(account_book_seq);
CREATE INDEX IF NOT EXISTS idx_transaction_user_seq ON transaction(user_seq);
CREATE INDEX IF NOT EXISTS idx_transaction_category_seq ON transaction(category_seq);
CREATE INDEX IF NOT EXISTS idx_transaction_date ON transaction(transaction_date);

-- 카테고리
CREATE TABLE IF NOT EXISTS category (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255),
    description VARCHAR(255),
    user_seq    BIGINT,
    color       VARCHAR(255),
    type        VARCHAR(10) NOT NULL DEFAULT 'EXPENSE',
    created_at  VARCHAR(14) NOT NULL,
    updated_at  VARCHAR(14) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_category_user_seq ON category(user_seq);

-- 분류(Classification)
CREATE TABLE IF NOT EXISTS classification (
    id               BIGSERIAL PRIMARY KEY,
    name             VARCHAR(255),
    account_book_seq BIGINT,
    created_at       VARCHAR(14) NOT NULL,
    updated_at       VARCHAR(14) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_classification_account_book_seq ON classification(account_book_seq);
