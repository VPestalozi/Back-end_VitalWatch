import { Pool } from 'pg';

export const pool = new Pool({
  user: 'admin',
  host: 'localhost',
  database: 'saude_pwa',
  password: 'password123',
  port: 5432,
});