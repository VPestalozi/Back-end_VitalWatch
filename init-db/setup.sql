CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "timescaledb";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'paciente' CHECK (role IN ('paciente', 'enfermeira'))
);

CREATE TABLE pacientes (
    paciente_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    enfermeira_id UUID REFERENCES users(id) ON DELETE SET NULL,
    id_micro VARCHAR(100) UNIQUE,
    nome VARCHAR(100),
    idade INT,
    altura DECIMAL(5,2),
    peso DECIMAL(5,2)
);

CREATE TABLE medidas_brutas (
    time TIMESTAMPTZ NOT NULL,
    paciente_id UUID NOT NULL REFERENCES pacientes(paciente_id) ON DELETE CASCADE,
    batimentos INT,
    oxigenacao INT
);

SELECT create_hypertable('medidas_brutas', 'time');

CREATE MATERIALIZED VIEW estatisticas_diarias
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 day', time) AS data_referencia,
    paciente_id,
    avg(batimentos)::INT AS media_batimentos,
    avg(oxigenacao)::INT AS media_oxigenacao,
    min(batimentos) AS min_batimentos,
    max(batimentos) AS max_batimentos,
    min(oxigenacao) AS min_oxigenacao,
    max(oxigenacao) AS max_oxigenacao
FROM medidas_brutas
GROUP BY data_referencia, paciente_id
WITH NO DATA;

SELECT add_continuous_aggregate_policy('estatisticas_diarias',
    start_offset => INTERVAL '2 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

-- Força a agregação em tempo real caso o banco venha a ser recriado do zero
ALTER MATERIALIZED VIEW estatisticas_diarias SET (timescaledb.materialized_only = false);

SELECT add_retention_policy('medidas_brutas', INTERVAL '2 days');