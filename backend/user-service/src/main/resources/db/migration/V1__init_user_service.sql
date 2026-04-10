CREATE TABLE IF NOT EXISTS users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    email VARCHAR(255),
    name VARCHAR(255),
    password VARCHAR(255),
    image_url VARCHAR(255),
    auth_provider VARCHAR(255),
    provider_id VARCHAR(255),
    role VARCHAR(255),
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email)
);
