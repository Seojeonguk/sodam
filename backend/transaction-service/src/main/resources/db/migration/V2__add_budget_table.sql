CREATE TABLE IF NOT EXISTS `budget` (
    id          BIGINT NOT NULL AUTO_INCREMENT,
    account_book_seq BIGINT NOT NULL,
    user_seq    BIGINT NOT NULL,
    category_seq BIGINT,
    year_month  VARCHAR(6) NOT NULL COMMENT 'YYYYMM',
    amount      DECIMAL(19,2) NOT NULL,
    created_at  VARCHAR(14) NOT NULL,
    updated_at  VARCHAR(14) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_budget (account_book_seq, category_seq, year_month),
    KEY idx_budget_account_book (account_book_seq),
    KEY idx_budget_user (user_seq),
    KEY idx_budget_year_month (year_month)
);
