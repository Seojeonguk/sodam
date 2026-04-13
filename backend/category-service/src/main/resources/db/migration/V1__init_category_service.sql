CREATE TABLE IF NOT EXISTS category (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255),
    description VARCHAR(255),
    user_seq BIGINT,
    color VARCHAR(255),
    created_at VARCHAR(14) NOT NULL,
    updated_at VARCHAR(14) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_category_user_seq (user_seq)
);

CREATE TABLE IF NOT EXISTS classification (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255),
    account_book_seq BIGINT,
    created_at VARCHAR(14) NOT NULL,
    updated_at VARCHAR(14) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_type_account_book_seq (account_book_seq)
);
