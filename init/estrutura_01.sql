CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
);

CREATE TABLE user_info (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    nome VARCHAR(100),
    idade INT,
    altura DECIMAL(5,2),
    peso DECIMAL(5,2)
);

CREATE TABLE medidas_raw (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    batimentos INT,
    oxigenacao INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE estatisticas_diarias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    data_referencia DATE NOT NULL,
    media_batimentos INT,
    media_oxigenacao INT,
    min_batimentos INT,
    max_batimentos INT,
    UNIQUE(user_id, data_referencia)
);