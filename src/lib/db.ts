import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

export function hasDbConfig(): boolean {
  return Boolean(process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME);
}

export function shouldUseCsvFallback(): boolean {
  return process.env.USE_CSV_FALLBACK !== "false";
}

export function getPool(): mysql.Pool {
  if (!hasDbConfig()) {
    throw new Error("Database environment variables are not configured.");
  }

  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT ?? 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: true
    });
  }

  return pool;
}
