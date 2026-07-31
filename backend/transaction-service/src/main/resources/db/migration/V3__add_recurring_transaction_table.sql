CREATE TABLE recurring_transaction (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_book_seq BIGINT       NOT NULL,
    user_seq      BIGINT          NOT NULL,
    category_seq  BIGINT,
    amount        DECIMAL(19, 2)  NOT NULL,
    description   VARCHAR(255),
    type          VARCHAR(20)     NOT NULL,
    day_of_month  INT             NOT NULL COMMENT '매월 몇 일에 실행할지 (1~31)',
    is_active     TINYINT(1)      NOT NULL DEFAULT 1 COMMENT '활성 여부',
    created_at    VARCHAR(14)     NOT NULL,
    updated_at    VARCHAR(14)     NOT NULL
);
