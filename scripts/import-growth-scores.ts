import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { getPool, nullable, upsert } from "./shared";

type CsvRow = Record<string, string>;

const modelDir = path.join(process.cwd(), "data", "model-output");

function readModelCsv(fileName: string): CsvRow[] {
  const content = fs.readFileSync(path.join(modelDir, fileName), "utf8");

  return parse(content, {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    trim: true
  }) as CsvRow[];
}

function numberOrNull(value: string | undefined): number | null {
  if (value === undefined || value === "") return null;

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function integerOrNull(value: string | undefined): number | null {
  const number = numberOrNull(value);

  return number === null ? null : Math.trunc(number);
}

async function main() {
  const scoresPath = path.join(modelDir, "growth_scores.csv");
  const factorsPath = path.join(modelDir, "growth_score_factors.csv");
  const metadataPath = path.join(modelDir, "growth_score_metadata.json");

  if (!fs.existsSync(scoresPath)) {
    throw new Error(
      "Missing data/model-output/growth_scores.csv"
    );
  }

  if (!fs.existsSync(factorsPath)) {
    throw new Error(
      "Missing data/model-output/growth_score_factors.csv"
    );
  }

  if (!fs.existsSync(metadataPath)) {
    throw new Error(
      "Missing data/model-output/growth_score_metadata.json"
    );
  }

  const scores = readModelCsv("growth_scores.csv");
  const factors = readModelCsv("growth_score_factors.csv");

  const metadata = JSON.parse(
    fs.readFileSync(metadataPath, "utf8")
  ) as {
    model_version?: string;
    output_clip_min?: number;
    output_clip_max?: number;
  };

  const metadataModelVersion = metadata.model_version ?? "v1.0";

  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    /*
     * 1. growth_scores 적재
     */
    for (const row of scores) {
      const modelVersion =
        row.model_version || metadataModelVersion;

      const growthScore = numberOrNull(row.growth_score);

      if (growthScore === null) {
        throw new Error(
          `growth_score is missing. company_id=${row.company_id}`
        );
      }

      if (
        metadata.output_clip_min !== undefined &&
        metadata.output_clip_max !== undefined &&
        (
          growthScore < metadata.output_clip_min ||
          growthScore > metadata.output_clip_max
        )
      ) {
        throw new Error(
          `growth_score out of metadata validation range. ` +
          `company_id=${row.company_id}, growth_score=${growthScore}`
        );
      }

      await upsert(
        connection,
        "growth_scores",
        {
          company_id: Number(row.company_id),

          growth_score: growthScore,
          growth_grade: row.growth_grade,
          growth_rank: Number(row.growth_rank),
          growth_percentile: Number(row.growth_percentile),

          /*
           * 실제 CSV:
           * industry_rank / industry_percentile
           *
           * DB:
           * industry_growth_rank / industry_growth_percentile
           */
          industry_growth_rank: integerOrNull(
            row.industry_rank
          ),

          industry_growth_percentile: numberOrNull(
            row.industry_percentile
          ),

          /*
           * 영역 score의 빈 문자열은 반드시 NULL 유지
           */
          financial_score: numberOrNull(
            row.financial_score
          ),

          patent_score: numberOrNull(
            row.patent_score
          ),

          employment_score: numberOrNull(
            row.employment_score
          ),

          news_event_score: numberOrNull(
            row.news_event_score
          ),

          industry_score: numberOrNull(
            row.industry_score
          ),

          financial_data_available: integerOrNull(
            row.financial_data_available
          ),

          patent_data_available: integerOrNull(
            row.patent_data_available
          ),

          employment_data_available: integerOrNull(
            row.employment_data_available
          ),

          news_event_data_available: integerOrNull(
            row.news_event_data_available
          ),

          industry_data_available: integerOrNull(
            row.industry_data_available
          ),

          coverage_score: numberOrNull(
            row.coverage_score
          ),

          model_version: modelVersion,

          /*
           * CSV는 YYYY-MM-DD.
           * MySQL DATETIME에 정상 저장되도록 00:00:00 추가.
           */
          calculated_at: row.calculated_at.includes(" ")
            ? row.calculated_at
            : `${row.calculated_at} 00:00:00`,

          is_mock: 0
        },
        [
          "growth_score",
          "growth_grade",
          "growth_rank",
          "growth_percentile",

          "industry_growth_rank",
          "industry_growth_percentile",

          "financial_score",
          "patent_score",
          "employment_score",
          "news_event_score",
          "industry_score",

          "financial_data_available",
          "patent_data_available",
          "employment_data_available",
          "news_event_data_available",
          "industry_data_available",

          "coverage_score",

          "calculated_at",
          "is_mock"
        ]
      );
    }

    /*
     * 2. model_version 기준 기존 실제 factor 삭제
     *
     * 같은 v1.0을 재import해도 factor가 중복되지 않도록 처리.
     */
    const modelVersions = Array.from(
      new Set(
        scores.map(
          (row) =>
            row.model_version || metadataModelVersion
        )
      )
    );

    for (const modelVersion of modelVersions) {
      await connection.execute(
        `
        DELETE FROM growth_score_factors
        WHERE model_version = ?
        `,
        [modelVersion]
      );
    }

    /*
     * 3. growth_score_factors 적재
     *
     * 실제 factor 파일에는 model_version,
     * display_order가 없으므로 import 시 생성.
     */
    const displayOrderMap = new Map<string, number>();

    for (const row of factors) {
      const modelVersion = metadataModelVersion;

      const groupKey =
        `${row.company_id}:${row.direction}`;

      const displayOrder =
        (displayOrderMap.get(groupKey) ?? 0) + 1;

      displayOrderMap.set(
        groupKey,
        displayOrder
      );

      await connection.execute(
        `
        INSERT INTO growth_score_factors
        (
          company_id,
          model_version,
          category,
          feature_name,
          feature_value,
          contribution,
          direction,
          description,
          display_order
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          Number(row.company_id),
          modelVersion,
          row.category,
          row.feature_name,

          /*
           * 실제 Feature 값 그대로 보존.
           * "" → NULL
           */
          row.feature_value === ""
            ? null
            : nullable(row.feature_value),

          Number(row.contribution),
          row.direction,
          row.description,
          displayOrder
        ]
      );
    }

    await connection.commit();

    console.log(
      `Imported ${scores.length} real growth scores.`
    );

    console.log(
      `Imported ${factors.length} real growth score factors.`
    );

    console.log(
      `Model version: ${metadataModelVersion}`
    );
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});