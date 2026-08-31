import { boolish, getPool, nullable, normalizeSearchName, readCsv, upsert } from "./shared";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const selected = readCsv("companies_300.csv");
const basicRows = readCsv("company_basic_features.csv");
const latestBasic = latestByCompany(basicRows);

function latestByCompany(rows: Record<string, string>[]) {
  const map = new Map<number, Record<string, string>>();
  for (const row of rows) {
    const companyId = Number(row.company_id);
    const current = map.get(companyId);
    if (!current || Number(row.feature_year) >= Number(current.feature_year)) map.set(companyId, row);
  }
  return map;
}

async function main() {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const row of selected) {
      const companyId = Number(row["선정번호"]);
      const basic = latestBasic.get(companyId);
      const companyName = row["업체명"];
      await upsert(
        connection,
        "companies",
        {
          company_id: companyId,
          company_name: companyName,
          search_name: normalizeSearchName(companyName),
          founded_year: nullable(basic?.founded_year ?? row["설립연도"]),
          company_age: nullable(basic?.company_age ?? row["기업연령"]),
          venture_type: basic?.venture_type ?? row["벤처확인유형"] ?? null,
          venture_renewal: basic?.venture_renewal ?? row["신규_재확인"] ?? null,
          industry: basic?.industry ?? row["산업"] ?? null,
          sub_industry: basic?.sub_industry ?? row["세부산업"] ?? null,
          industry_code: basic?.industry_code ?? null,
          region: basic?.region ?? row["지역"] ?? null,
          macro_region: basic?.macro_region ?? row["권역"] ?? null,
          id_confidence: basic?.id_confidence ?? row["상호식별성"] ?? null,
          has_dart: boolish(basic?.has_dart)
        },
        ["company_name", "search_name", "founded_year", "company_age", "venture_type", "venture_renewal", "industry", "sub_industry", "industry_code", "region", "macro_region", "id_confidence", "has_dart"]
      );
    }

    for (const row of basicRows) {
      await upsert(connection, "company_features", {
        company_id: Number(row.company_id),
        feature_year: Number(row.feature_year),
        period_end: row.period_end || null,
        company_age: nullable(row.company_age),
        age_basis: row.age_basis || null,
        company_age_estimated: boolish(row.company_age_estimated),
        growth_stage_proxy: row.growth_stage_proxy || null
      }, ["period_end", "company_age", "age_basis", "company_age_estimated", "growth_stage_proxy"]);
    }

    await importRows(connection, "financial_features", "financial_features.csv", [
      "company_id", "feature_year", "period_end", "has_financial", "financial_source", "n_financial_years", "revenue_growth_1y", "revenue_cagr_3y", "revenue_cagr_best", "asset_growth_1y", "asset_cagr_3y", "operating_margin", "operating_margin_change_1y", "net_margin", "roa", "liabilities_to_assets", "current_ratio", "cash_ratio", "borrowings_to_assets", "operating_cashflow_margin", "operating_cashflow_positive", "rd_to_revenue", "turned_profitable_1y", "is_profitable", "pre_revenue", "equity_negative", "revenue_log"
    ]);
    await importRows(connection, "patent_features", "patent_features.csv", [
      "company_id", "feature_year", "period_end", "has_patent", "patent_momentum", "patent_count_3y", "patent_count_1y", "new_patent_activity", "patent_per_year", "registered_ratio_mature", "unique_ipc_count", "new_ipc_count_1y"
    ]);
    await importRows(connection, "employment_features", "organization_employment_features.csv", [
      "company_id", "company_name", "employee_count_latest", "employee_growth_6m", "net_hiring_rate_6m", "employee_growth_acceleration", "employee_growth_slope", "employee_volatility"
    ]);
    await importRows(connection, "news_event_features", "news_growth_event_features.csv", [
      "company_id", "growth_event_12m_count", "high_intensity_event_12m_count", "investment_event_24m_count", "contract_event_12m_count", "technology_rnd_event_12m_count", "recent_growth_event_days", "event_type_diversity_12m", "positive_negative_balance_12m", "news_observability_flag"
    ]);
    await importRows(connection, "industry_features", "industry_market_features.csv", [
      "industry_group_code", "industry_revenue_growth_1y", "industry_employee_growth_1y", "industry_company_growth_1y", "industry_rd_growth_1y", "industry_startup_rate_latest"
    ]);
    await importRawNewsEvents(connection);

    await connection.commit();
    console.log(`Imported ${selected.length} companies and feature CSVs.`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

async function importRows(connection: Parameters<typeof upsert>[0], table: string, fileName: string, columns: string[]) {
  for (const source of readCsv(fileName)) {
    const row = Object.fromEntries(columns.map((column) => [column, column.endsWith("flag") || column.startsWith("has_") || column.startsWith("is_") ? boolish(source[column]) : nullable(source[column])]));
    await upsert(connection, table, row, columns.filter((column) => !["company_id", "feature_year", "industry_group_code"].includes(column)));
  }
}

async function importRawNewsEvents(connection: Parameters<typeof upsert>[0]) {
  const filePath = path.join(process.cwd(), "data", "source", "news_growth_event_raw.csv");
  if (!fs.existsSync(filePath)) return;
  let count = 0;
  for (const source of readCsv("news_growth_event_raw.csv")) {
    if (!isValidRawEvent(source)) continue;
    const originalLink = source.original_link || null;
    const naverLink = source.naver_link || null;
    const rawEventHash = createHash("sha256")
      .update([source.company_id, source.published_at, originalLink, naverLink, source.news_title].join("|"))
      .digest("hex");
    await upsert(connection, "growth_events", {
      company_id: Number(source.company_id),
      event_date: source.published_at ? source.published_at.slice(0, 10) : null,
      published_at: source.published_at || null,
      event_type: source.event_type || null,
      event_direction: normalizeDirection(source.event_direction),
      event_intensity: nullable(source.event_intensity),
      event_confidence: nullable(source.event_confidence),
      title: source.news_title || null,
      news_title: source.news_title || null,
      summary: source.event_summary || source.news_description || null,
      event_summary: source.event_summary || null,
      source_name: source.source_domain || null,
      source_domain: source.source_domain || null,
      source_url: originalLink ?? naverLink,
      original_link: originalLink,
      naver_link: naverLink,
      raw_event_hash: rawEventHash
    }, ["event_date", "published_at", "event_type", "event_direction", "event_intensity", "event_confidence", "title", "news_title", "summary", "event_summary", "source_name", "source_domain", "source_url", "original_link", "naver_link"]);
    count += 1;
  }
  console.log(`Imported ${count} valid raw growth events.`);
}

function isValidRawEvent(row: Record<string, string>) {
  return truthy(row.valid_news_flag) && truthy(row.company_match) && !truthy(row.duplicate_flag) && !truthy(row.outside_window_flag) && Boolean(row.event_type);
}

function truthy(value: string | undefined) {
  return ["true", "1", "yes", "y"].includes((value ?? "").toLowerCase());
}

function normalizeDirection(value: string | undefined) {
  if (value === "positive" || value === "negative") return value;
  return "neutral";
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
