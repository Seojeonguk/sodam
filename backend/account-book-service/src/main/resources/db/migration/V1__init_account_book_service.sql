CREATE TABLE IF NOT EXISTS account_book (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255),
    created_at VARCHAR(14) NOT NULL,
    created_by BIGINT,
    updated_at VARCHAR(14) NOT NULL,
    updated_by BIGINT,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS account_book_member (
    id BIGINT NOT NULL AUTO_INCREMENT,
    account_book_id BIGINT,
    user_id BIGINT,
    authority VARCHAR(255),
    is_available VARCHAR(255),
    available_from VARCHAR(14),
    available_to VARCHAR(14),
    created_at VARCHAR(14) NOT NULL,
    created_by BIGINT,
    updated_at VARCHAR(14) NOT NULL,
    updated_by BIGINT,
    PRIMARY KEY (id),
    KEY idx_account_book_member_account_book_id (account_book_id),
    KEY idx_account_book_member_user_id (user_id)
);
