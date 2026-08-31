import { getPool, hasDbConfig, shouldUseCsvFallback } from "@/lib/db";
import { getCsvDashboard } from "@/lib/csvData";
import type { DashboardData, GrowthEvent, GrowthScore, GrowthScoreFactor, IndustryRankingRow, ScoreCategory } from "@/types/company";
import { getCompany } from "@/repositories/companyRepository";
import { featureMetadata, EVENT_CONFIDENCE_THRESHOLD } from "@/constants/featureMetadata";
import { formatFeatureValue } from "@/utils/format";
import type { RowDataPacket } from "mysql2";

interface ScoreRow extends RowDataPacket {
  company_id: number;
  growth_score: number;
  growth_grade: string;
  growth_rank: number;
  growth_percentile: number;
  industry_growth_rank: number | null;
  industry_growth_percentile: number | null;
  financial_score: number;
  patent_score: number;
  employment_score: number;
  news_event_score: number;
  industry_score: number;
  model_version: string;
  calculated_at: Date;
  is_mock: number;
}

interface FactorRow extends RowDataPacket {
  category: ScoreCategory;
  feature_name: string;
  feature_value: string | number | null;
  contribution: number;
  direction: "positive" | "negative";
  description: string;
  display_order: number;
}

interface RankingRow extends RowDataPacket {
  rank_position: number;
  company_id: number;
  company_name: string;
  growth_score: number;
}

interface EventRow extends RowDataPacket {
  event_id: number;
  published_at: Date | string | null;
  event_type: string;
  event_direction: "positive" | "neutral" | "negative" | null;
  event_intensity: number | null;
  event_confidence: number | null;
  news_title: string;
  event_summary: string | null;
  source_domain: string | null;
  original_link: string | null;
  naver_link: string | null;
}

function mapScore(row: ScoreRow): GrowthScore {
  return {
    companyId: row.company_id,
    growthScore: Number(row.growth_score),
    growthGrade: row.growth_grade,
    growthRank: row.growth_rank,
    growthPercentile: row.growth_percentile,
    industryGrowthRank: row.industry_growth_rank,
    industryGrowthPercentile: row.industry_growth_percentile,
    financialScore: Number(row.financial_score),
    patentScore: Number(row.patent_score),
    employmentScore: Number(row.employment_score),
    newsEventScore: Number(row.news_event_score),
    industryScore: Number(row.industry_score),
    modelVersion: row.model_version,
    calculatedAt: row.calculated_at.toISOString(),
    isMock: Boolean(row.is_mock)
  };
}

function mapFactor(row: FactorRow): GrowthScoreFactor {
  const valueText = formatFeatureValue(row.feature_name, row.feature_value);
  const label = featureMetadata[row.feature_name]?.label ?? row.feature_name;
  return {
    category: row.category,
    featureName: row.feature_name,
    featureValue: row.feature_value,
    contribution: Number(row.contribution),
    direction: deriveSignalDirection(row.feature_name, row.feature_value, row.direction),
    description: `${label} ${valueText}`,
    valueText,
    displayOrder: row.display_order
  };
}

function deriveSignalDirection(featureName: string, value: string | number | null, fallback: "positive" | "negative") {
  if (value === null || value === "") return fallback;
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  if (featureName === "liabilities_to_assets") return number >= 0.7 ? "negative" : "positive";
  if (featureName === "employee_growth_6m" || featureName === "revenue_growth_1y" || featureName === "operating_margin_change_1y") {
    return number < 0 ? "negative" : "positive";
  }
  if (featureName.includes("_count")) return number > 0 ? "positive" : "negative";
  return fallback;
}

export async function getDashboard(companyId: number): Promise<DashboardData | null> {
  if (!hasDbConfig() && shouldUseCsvFallback()) return getCsvDashboard(companyId);
  const company = await getCompany(companyId);
  if (!company) return null;

  const [scoreRows] = await getPool().execute<ScoreRow[]>(
    `SELECT *
       FROM growth_scores
      WHERE company_id = :companyId
      ORDER BY is_mock ASC, calculated_at DESC
      LIMIT 1`,
    { companyId }
  );
  if (!scoreRows[0]) return null;
  const score = mapScore(scoreRows[0]);

  const [factorRows] = await getPool().execute<FactorRow[]>(
    `SELECT category, feature_name, feature_value, contribution, direction, description, display_order
       FROM growth_score_factors
      WHERE company_id = :companyId AND model_version = :modelVersion
      ORDER BY display_order ASC`,
    { companyId, modelVersion: score.modelVersion }
  );
  const factors = factorRows.map(mapFactor);

  const industryData = await getIndustryComparison(company.industry, companyId);
  return {
    company,
    score,
    positiveFactors: factors.filter((item) => item.direction === "positive").slice(0, 3),
    negativeFactors: factors.filter((item) => item.direction === "negative").slice(0, 3),
    featureDetails: await getFeatureDetails(companyId),
    industryComparison: {
      industryName: company.industry ?? "미분류",
      rank: score.industryGrowthRank,
      percentile: score.industryGrowthPercentile,
      averageScore: industryData.averageScore,
      topScore: industryData.topScore,
      rankings: industryData.rankings
    },
    growthEvents: await getGrowthEvents(companyId),
    dataConfidence: await getDataConfidence(companyId, company)
  };
}

async function getFeatureDetails(companyId: number): Promise<DashboardData["featureDetails"]> {
  const pool = getPool();
  const [financial] = await pool.execute<Array<RowDataPacket & Record<string, string | number | null>>>("SELECT * FROM financial_features WHERE company_id = :companyId ORDER BY feature_year DESC LIMIT 1", { companyId });
  const [patent] = await pool.execute<Array<RowDataPacket & Record<string, string | number | null>>>("SELECT * FROM patent_features WHERE company_id = :companyId ORDER BY feature_year DESC LIMIT 1", { companyId });
  const [employment] = await pool.execute<Array<RowDataPacket & Record<string, string | number | null>>>("SELECT * FROM employment_features WHERE company_id = :companyId LIMIT 1", { companyId });
  const [news] = await pool.execute<Array<RowDataPacket & Record<string, string | number | null>>>("SELECT * FROM news_event_features WHERE company_id = :companyId LIMIT 1", { companyId });
  return {
    financial: rows(financial[0], ["revenue_growth_1y", "operating_margin", "operating_margin_change_1y", "liabilities_to_assets", "current_ratio"]),
    patent: rows(patent[0], ["patent_count_3y", "patent_count_1y", "unique_ipc_count", "patent_momentum"]),
    employment: rows(employment[0], ["employee_count_latest", "employee_growth_6m", "net_hiring_rate_6m", "employee_growth_slope"]),
    news_event: rows(news[0], ["growth_event_12m_count", "investment_event_24m_count", "contract_event_12m_count", "recent_growth_event_days"]),
    industry: []
  };
}

function rows(row: Record<string, string | number | null> | undefined, keys: string[]) {
  return keys.map((key) => ({
    label: featureMetadata[key]?.label ?? key,
    description: featureMetadata[key]?.description ?? "해당 Feature의 관측값입니다.",
    value: formatFeatureValue(key, row?.[key])
  }));
}

async function getDataConfidence(companyId: number, company: NonNullable<Awaited<ReturnType<typeof getCompany>>>): Promise<DashboardData["dataConfidence"]> {
  const [financial] = await getPool().execute<Array<RowDataPacket & { has_financial: number | null; n_financial_years: number | null }>>(
    "SELECT has_financial, n_financial_years FROM financial_features WHERE company_id = :companyId ORDER BY feature_year DESC LIMIT 1",
    { companyId }
  );
  const [news] = await getPool().execute<Array<RowDataPacket & { news_observability_flag: number | null }>>(
    "SELECT news_observability_flag FROM news_event_features WHERE company_id = :companyId LIMIT 1",
    { companyId }
  );
  return [
    { label: "기업 식별 신뢰도", value: company.idConfidence ?? "확인 불가", ok: Boolean(company.idConfidence) },
    { label: "DART 데이터", value: company.hasDart ? "보유" : "없음", ok: Boolean(company.hasDart) },
    {
      label: "재무 데이터",
      value: financial[0]?.n_financial_years ? `${financial[0].n_financial_years}개년` : "확인 불가",
      ok: Boolean(financial[0]?.has_financial)
    },
    { label: "업력", value: company.companyAge ? `${company.companyAge.toFixed(1)}년` : "확인 불가", ok: Boolean(company.companyAge) },
    { label: "뉴스 관측", value: news[0]?.news_observability_flag ? "가능" : "없음", ok: Boolean(news[0]?.news_observability_flag) }
  ];
}

async function getIndustryComparison(industry: string | null, companyId: number): Promise<{ averageScore: number | null; topScore: number | null; rankings: IndustryRankingRow[] }> {
  if (!industry) return { averageScore: null, topScore: null, rankings: [] };
  const [rows] = await getPool().execute<RankingRow[]>(
    `WITH latest_scores AS (
       SELECT gs.*
         FROM growth_scores gs
         JOIN (
           SELECT company_id,
                  COALESCE(
                    MAX(CASE WHEN is_mock = 0 THEN calculated_at END),
                    MAX(CASE WHEN is_mock = 1 THEN calculated_at END)
                  ) AS calculated_at
             FROM growth_scores
            GROUP BY company_id
         ) picked ON picked.company_id = gs.company_id AND picked.calculated_at = gs.calculated_at
      ),
      ranked AS (
        SELECT c.company_id, c.company_name, latest_scores.growth_score,
               ROW_NUMBER() OVER (ORDER BY latest_scores.growth_score DESC) AS rank_position
          FROM companies c
          JOIN latest_scores ON latest_scores.company_id = c.company_id
         WHERE c.industry = :industry
      )
      SELECT rank_position, company_id, company_name, growth_score
        FROM ranked
       WHERE rank_position <= 3 OR company_id = :companyId
       ORDER BY rank_position`,
    { industry, companyId }
  );
  const [stats] = await getPool().execute<Array<RowDataPacket & { average_score: number | null; top_score: number | null }>>(
    `WITH latest_scores AS (
       SELECT gs.*
         FROM growth_scores gs
         JOIN (
           SELECT company_id,
                  COALESCE(
                    MAX(CASE WHEN is_mock = 0 THEN calculated_at END),
                    MAX(CASE WHEN is_mock = 1 THEN calculated_at END)
                  ) AS calculated_at
             FROM growth_scores
            GROUP BY company_id
         ) picked ON picked.company_id = gs.company_id AND picked.calculated_at = gs.calculated_at
      )
      SELECT AVG(latest_scores.growth_score) AS average_score, MAX(latest_scores.growth_score) AS top_score
        FROM companies c
        JOIN latest_scores ON latest_scores.company_id = c.company_id
       WHERE c.industry = :industry`,
    { industry }
  );
  return {
    averageScore: stats[0]?.average_score === null ? null : Number(Number(stats[0]?.average_score).toFixed(1)),
    topScore: stats[0]?.top_score === null ? null : Number(Number(stats[0]?.top_score).toFixed(1)),
    rankings: rows.map((row) => ({
      rank: row.rank_position,
      companyId: row.company_id,
      companyName: row.company_name,
      growthScore: Number(row.growth_score),
      isCurrent: row.company_id === companyId
    }))
  };
}

async function getGrowthEvents(companyId: number): Promise<GrowthEvent[]> {
  const [rows] = await getPool().execute<EventRow[]>(
    `SELECT event_id, published_at, event_type, event_direction, event_intensity, event_confidence,
            news_title, event_summary, source_domain, original_link, naver_link
       FROM growth_events
      WHERE company_id = :companyId
        AND event_type IS NOT NULL
        AND (event_confidence IS NULL OR event_confidence >= :confidence)
      ORDER BY published_at DESC
      LIMIT 5`,
    { companyId, confidence: EVENT_CONFIDENCE_THRESHOLD }
  );
  return rows.map((row) => ({
    eventId: String(row.event_id),
    publishedAt: row.published_at instanceof Date ? row.published_at.toISOString() : String(row.published_at ?? ""),
    eventType: row.event_type,
    eventDirection: row.event_direction ?? "neutral",
    eventIntensity: row.event_intensity,
    eventConfidence: row.event_confidence,
    newsTitle: row.news_title,
    eventSummary: row.event_summary,
    sourceDomain: row.source_domain,
    href: row.original_link ?? row.naver_link
  }));
}
