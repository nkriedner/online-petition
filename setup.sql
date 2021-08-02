DROP TABLE IF EXISTS signatures;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id         SERIAL PRIMARY KEY,
    first_name VARCHAR NOT NULL CHECK (first_name != ''),
    last_name  VARCHAR NOT NULL CHECK (last_name != ''),
    email_address  VARCHAR NOT NULL UNIQUE CHECK (email_address != ''),
    password_hash  VARCHAR NOT NULL CHECK (password_hash != ''),
    timestamp  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
    age INTEGER,
    city VARCHAR(100),
    url VARCHAR(300),
    timestamp  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE signatures (
    id         SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
    signature  VARCHAR NOT NULL CHECK (signature != ''),
    timestamp  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);