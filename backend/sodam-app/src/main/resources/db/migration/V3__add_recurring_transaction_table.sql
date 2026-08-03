CREATE TABLE IF NOT EXISTS recurring_transaction (
    id               BIGSERIAL PRIMARY KEY,
    account_book_seq BIGINT        NOT NULL,
    user_seq         BIGINT        NOT NULL,
    category_seq     BIGINT,
    amount           DECIMAL(19,2) NOT NULL,
    description      VARCHAR(255),
    type             VARCHAR(20)   NOT NULL,
    day_of_month     INT           NOT NULL,
    is_active        BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at       VARCHAR(14)   NOT NULL,
    updated_at       VARCHAR(14)   NOT NULL
);
