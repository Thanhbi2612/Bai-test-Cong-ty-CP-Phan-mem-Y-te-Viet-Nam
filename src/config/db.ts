import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Neon/Vercel Postgres cung cap DATABASE_URL (co sslmode=require).
// Neu khong co thi fallback ve cac bien PGHOST/PGPORT/... cho local dev.
export const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 1, // serverless: moi lan goi ham co the la 1 instance moi, tranh mo qua nhieu connection
    })
  : new Pool({
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT) || 5432,
      database: process.env.PGDATABASE || 'vimes_ton_kho',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
    });

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});
