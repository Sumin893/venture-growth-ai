import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { getPool, readCsv, upsert } from "./shared";

const modelDir = path.join(process.cwd(), "data", "model-output");

async function main() {
  const scoresPath = path.join(modelDir, "growth_scores.csv");
  const factorsPath = path.join(modelDir, "growth_score_factors.csv");
  if (!fs.existsSync(scoresPath)) throw new Error("Missing data/model-output/growth_scores.csv");
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const row of readModelCsv("growth_scores.csv")) {
      await upsert(connection, "growth_scores", {
        company_id: Number(row.company_id),
        growth_score: Number(row.growth_score),
        growth_grade: row.growth_grade,
        growth_rank: Number(row.growth_rank),
        growth_percentile: Number(row.growth_percentile),
        industry_growth_rank: Number(row.industry_growth_rank),
        industry_growth_percentile: Number(row.industry_growth_percentile),
        financial_score: Number(row.financial_score),
        patent_score: Number(row.patent_score),
        employment_score: Number(row.employment_score),
        news_event_score: Number(row.news_event_score),
        industry_score: Number(row.industry_score),
        model_version: row.model_version,
        calculated_at: row.calculated_at,
        is_mock: 0
      }, ["growth_score", "growth_grade", "growth_rank", "growth_percentile", "industry_growth_rank", "industry_growth_percentile", "financial_score", "patent_score", "employment_score", "news_event_score", "industry_score", "calculated_at", "is_mock"]);
    }
    if (fs.existsSync(factorsPath)) {
      for (const row of readModelCsv("growth_score_factors.csv")) {
        await connection.execute(
          `INSERT INTO growth_score_factors
           (company_id, model_version, category, feature_name, feature_value, contribution, direction, description, display_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [Number(row.company_id), row.model_version ?? "v1.0", row.category, row.feature_name, row.feature_value, Number(row.contribution), row.direction, row.description, Number(row.display_order ?? 0)]
        );
      }
    }
    await connection.commit();
    console.log("Imported real growth score CSV outputs.");
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

function readModelCsv(fileName: string) {
  const content = fs.readFileSync(path.join(modelDir, fileName), "utf8");
  return parse(content, { columns: true, bom: true, skip_empty_lines: true, trim: true }) as ReturnType<typeof readCsv>;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
