import { Pool } from 'pg';
import config from './index';
import pino from 'pino';

const logger = pino({ level: config.logging.level });

let pool: Pool | null = null;

export function getConnection(): Pool {
  if (!pool) {
    pool = new Pool({
      host: config.db.host,
      port: config.db.port,
      database: config.db.name,
      user: config.db.user,
      password: config.db.password,
      ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
      max: config.db.max,
      idleTimeoutMillis: config.db.idleTimeoutMillis,
      connectionTimeoutMillis: config.db.connectionTimeoutMillis,
    });

    pool.on('error', (err: Error) => logger.error('Unexpected error on idle client', err));
  }
  return pool;
}

export async function query(text: string, params?: any[]): Promise<any> {
  const client = await getConnection().connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

export async function queryOne(text: string, params?: any[]): Promise<any> {
  const result = await query(text, params);
  return result.rows[0];
}

export async function queryMany(text: string, params?: any[]): Promise<any[]> {
  const result = await query(text, params);
  return result.rows;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export default {
  getConnection,
  query,
  queryOne,
  queryMany,
  closePool,
};
