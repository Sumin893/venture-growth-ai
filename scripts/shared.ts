import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

export type CsvRow = Record<string, string>;

export const sourceDir = path.join(process.cwd(), "data", "source");

export function readCsv(fileName: string): CsvRow[] {
  const content = fs.readFileSync(path.join(sourceDir, fileName), "utf8");
  return parse(content, { columns: true, bom: true, skip_empty_lines: true, trim: true }) as CsvRow[];
}

export function nullable(value: string | undefined): string | number | null {
  if (value === undefined || value === "" || value === "nan" || value === "None") return null;
  const number = Number(value);
  return Number.isFinite(number) && /^-?\d+(\.\d+)?$/.test(value) ? number : value;
}

export function boolish(value: string | undefined): number | null {
  if (value === undefined || value === "") return null;
  if (value === "1" || value.toLowerCase() === "true" || value === "예") return 1;
  if (value === "0" || value.toLowerCase() === "false" || value === "아니오") return 0;
  return null;
}

export function normalizeSearchName(value: string): string {
  return value.trim().replace(/\s+/g, "").toLowerCase();
}

export function getPool(database = process.env.DB_NAME): mysql.Pool {
  return mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database,
    waitForConnections: true,
    connectionLimit: 4
  });
}

export async function upsert(
  connection: mysql.PoolConnection,
  table: string,
  row: Record<string, string | number | null>,
  updateColumns: string[]
) {
  const columns = Object.keys(row);
  const placeholders = columns.map(() => "?").join(", ");
  const updates = updateColumns.map((column) => `${column}=VALUES(${column})`).join(", ");
  await connection.execute(
    `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updates}`,
    columns.map((column) => row[column])
  );
}
