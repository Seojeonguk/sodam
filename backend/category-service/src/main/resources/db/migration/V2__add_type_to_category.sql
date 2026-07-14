-- 카테고리에 수입/지출 구분 타입 추가
ALTER TABLE category
    ADD COLUMN type VARCHAR(10) NOT NULL DEFAULT 'EXPENSE'
        COMMENT 'INCOME: 수입 카테고리, EXPENSE: 지출 카테고리';
