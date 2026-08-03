CREATE TABLE IF NOT EXISTS budget (
    id               BIGSERIAL PRIMARY KEY,
    account_book_seq BIGINT NOT NULL,
    user_seq         BIGINT NOT NULL,
    category_seq     BIGINT,
    setting_day      VARCHAR(6) NOT NULL,
    amount           DECIMAL(19,2) NOT NULL,
    created_at       VARCHAR(14) NOT NULL,
    updated_at       VARCHAR(14) NOT NULL,
    CONSTRAINT uk_budget UNIQUE (account_book_seq, category_seq, setting_day)
);

CREATE INDEX IF NOT EXISTS idx_budget_account_book ON budget(account_book_seq);
CREATE INDEX IF NOT EXISTS idx_budget_user ON budget(user_seq);
CREATE INDEX IF NOT EXISTS idx_budget_setting_day ON budget(setting_day);
