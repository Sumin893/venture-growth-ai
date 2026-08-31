import fs from "node:fs";
import path from "node:path";
import { readCsv, sourceDir } from "./shared";

const files = [
  "companies_300.csv",
  "company_basic_features.csv",
  "financial_features.csv",
  "patent_features.csv",
  "organization_employment_features.csv",
  "news_growth_event_features.csv",
  "news_growth_event_raw.csv",
  "industry_market_features.csv"
];

for (const file of files) {
  const rows = readCsv(file);
  const columns = rows[0] ? Object.keys(rows[0]) : [];
  const idColumn = columns.includes("company_id") ? "company_id" : columns.includes("선정번호") ? "선정번호" : null;
  const ids = idColumn ? rows.map((row) => row[idColumn]).filter(Boolean) : [];
  const uniqueIds = new Set(ids);
  const yearValues = columns.includes("feature_year") ? rows.map((row) => Number(row.feature_year)).filter(Number.isFinite) : [];
  const duplicateIds = ids.length - uniqueIds.size;
  const nullCells = rows.reduce((sum, row) => sum + columns.filter((column) => row[column] === "").length, 0);

  console.log(`\n${file}`);
  console.log(`  size: ${fs.statSync(path.join(sourceDir, file)).size} bytes`);
  console.log(`  shape: ${rows.length} rows x ${columns.length} columns`);
  console.log(`  columns: ${columns.join(", ")}`);
  console.log(`  id column: ${idColumn ?? "none"}`);
  console.log(`  unique ids: ${uniqueIds.size}`);
  console.log(`  duplicate id count: ${duplicateIds}`);
  console.log(`  feature year range: ${yearValues.length ? `${Math.min(...yearValues)}-${Math.max(...yearValues)}` : "n/a"}`);
  console.log(`  empty cells: ${nullCells}`);
}
