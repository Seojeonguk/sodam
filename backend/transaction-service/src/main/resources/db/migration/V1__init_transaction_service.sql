CREATE TABLE IF NOT EXISTS `transaction` (
    seq BIGINT NOT NULL AUTO_INCREMENT,
    account_book_seq BIGINT,
    user_seq BIGINT,
    category_seq BIGINT,
    amount DECIMAL(19,2) NOT NULL,
    description VARCHAR(255),
    transaction_date VARCHAR(14) NOT NULL,
    type VARCHAR(20) NOT NULL,
    satisfaction_rating INT,
    created_at VARCHAR(14) NOT NULL,
    updated_at VARCHAR(14) NOT NULL,
    PRIMARY KEY (seq),
    KEY idx_transaction_account_book_seq (account_book_seq),
    KEY idx_transaction_user_seq (user_seq),
    KEY idx_transaction_category_seq (category_seq),
    KEY idx_transaction_transaction_date (transaction_date)
);
