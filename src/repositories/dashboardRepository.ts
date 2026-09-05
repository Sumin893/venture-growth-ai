import { getPool, hasDbConfig, shouldUseCsvFallback } from "@/lib/db";
import { getCsvDashboard, getCsvIndustryTopGroups, TOP_INDUSTRY_GROUPS } from "@/lib/csvData";
import type { DashboardData, GrowthEvent, GrowthScore, GrowthScoreFactor, IndustryRankingRow, IndustryTopGroup, ScoreCategory } from "@/types/company";
import { getCompany } from "@/repositories/companyRepository";
import { EVENT_CONFIDENCE_THRESHOLD, featureMetadata } from "@/constants/featureMetadata";
import { formatFeatureValue } from "@/utils/format";
import { cacheLife, cacheTag } from "next/cache";
import type { RowDataPacket } from "mysql2";

const DASHBOARD_CACHE_REVALIDATE_SECONDS = 600;
const DASHBOARD_CACHE_EXPIRE_SECONDS = 1800;
const shouldLogDashboardCache = process.env.PROFILE_DASHBOARD_CACHE === "true";

class DashboardNotFoundError extends Error {
  constructor(companyId: number) {
    super(`Dashboard not found: ${companyId}`);
    this.name = "DashboardNotFoundError";
  }
}

interface ScoreRow extends RowDataPacket {
  company_id: number;
  growth_score: number | string;
  growth_grade: string;
  growth_rank: number;
  growth_percentile: number | string;

  industry_growth_rank: number | null;
  industry_growth_percentile: number | string | null;

  financial_score: number | string | null;
  patent_score: number | string | null;
  employment_score: number | string | null;
  news_event_score: number | string | null;
  industry_score: number | string | null;

  financial_data_available: number | null;
  patent_data_available: number | null;
  employment_data_available: number | null;
  news_event_data_available: number | null;
  industry_data_available: number | null;

  coverage_score: number | string | null;

  model_version: string;
  calculated_at: Date | string;
  is_mock: number;
}

interface FactorRow extends RowDataPacket {
  category: ScoreCategory;
  feature_name: string;
  feature_value: string | number | null;
  contribution: number | string;
  direction: "positive" | "negative";
  description: string;
  display_order: number;
}

interface RankingRow extends RowDataPacket {
  rank_position: number;
  company_id: number;
  company_name: string;
  growth_score: number | string;
  company_count: number;
  average_score: number | string | null;
  top_score: number | string | null;
}

interface CountRow extends RowDataPacket {
  count: number;
}

interface IndustryTopRow extends RowDataPacket {
  industry: string;
  rank_position: number;
  company_id: number;
  company_name: string;
  growth_score: number | string;
  model_version: string;
  is_mock: number;
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

function nullableNumber(value: number | string | null): number | null {
  if (value === null || value === "") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function dateToIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapScore(row: ScoreRow): GrowthScore {
  return {
    companyId: row.company_id,

    growthScore: Number(row.growth_score),
    growthGrade: row.growth_grade,
    growthRank: row.growth_rank,
    growthPercentile: Number(row.growth_percentile),
    growthRankTotal: null,

    industryGrowthRank: row.industry_growth_rank,
    industryGrowthPercentile: nullableNumber(row.industry_growth_percentile),
    industryGrowthRankTotal: null,

    financialScore: nullableNumber(row.financial_score),
    patentScore: nullableNumber(row.patent_score),
    employmentScore: nullableNumber(row.employment_score),
    newsEventScore: nullableNumber(row.news_event_score),
    industryScore: nullableNumber(row.industry_score),

    financialDataAvailable: Boolean(row.financial_data_available),
    patentDataAvailable: Boolean(row.patent_data_available),
    employmentDataAvailable: Boolean(row.employment_data_available),
    newsEventDataAvailable: Boolean(row.news_event_data_available),
    industryDataAvailable: Boolean(row.industry_data_available),

    coverageScore: nullableNumber(row.coverage_score) ?? 0,

    modelVersion: row.model_version,
    calculatedAt: dateToIso(row.calculated_at),
    isMock: Boolean(row.is_mock)
  };
}

function mapFactor(row: FactorRow): GrowthScoreFactor {
  const valueText = formatFeatureValue(row.feature_name, row.feature_value);

  return {
    category: row.category,
    featureName: row.feature_name,
    featureValue: row.feature_value,
    contribution: Number(row.contribution),
    direction: row.direction,
    description: row.description,
    valueText,
    displayOrder: row.display_order
  };
}

export async function getDashboard(companyId: number): Promise<DashboardData | null> {
  try {
    return await getCachedDashboard(companyId);
  } catch (error) {
    if (error instanceof DashboardNotFoundError) return null;
    throw error;
  }
}

async function getCachedDashboard(companyId: number): Promise<DashboardData> {
  "use cache: remote";
  cacheTag("company-dashboard");
  cacheTag(`company-dashboard:${companyId}`);
  cacheLife({
    revalidate: DASHBOARD_CACHE_REVALIDATE_SECONDS,
    expire: DASHBOARD_CACHE_EXPIRE_SECONDS
  });

  const dashboard = await getDashboardUncached(companyId);
  if (!dashboard) throw new DashboardNotFoundError(companyId);
  return dashboard;
}

export async function getDashboardUncached(companyId: number): Promise<DashboardData | null> {
  if (shouldLogDashboardCache) console.log(`[dashboard-cache] MISS companyId=${companyId}`);

  if (!hasDbConfig() && shouldUseCsvFallback()) return getCsvDashboard(companyId);

  const companyPromise = getCompany(companyId);
  const scorePromise = getPool().execute<ScoreRow[]>(
    `SELECT company_id, growth_score, growth_grade, growth_rank, growth_percentile,
            industry_growth_rank, industry_growth_percentile,
            financial_score, patent_score, employment_score, news_event_score, industry_score,
            financial_data_available, patent_data_available, employment_data_available,
            news_event_data_available, industry_data_available,
            coverage_score, model_version, calculated_at, is_mock
       FROM growth_scores
      WHERE company_id = :companyId
      ORDER BY is_mock ASC, calculated_at DESC
      LIMIT 1`,
    { companyId }
  );

  const [company, [scoreRows]] = await Promise.all([companyPromise, scorePromise]);
  if (!company) return null;
  if (!scoreRows[0]) return null;

  const score = mapScore(scoreRows[0]);
  const factorsPromise = getPool().execute<FactorRow[]>(
    `SELECT category, feature_name, feature_value, contribution, direction, description, display_order
       FROM growth_score_factors
      WHERE company_id = :companyId AND model_version = :modelVersion
      ORDER BY display_order ASC`,
    { companyId, modelVersion: score.modelVersion }
  );
  const totalCountPromise = getGrowthScoreCompanyCount();
  const industryDataPromise = getIndustryComparison(company.industry, companyId);
  const featureDetailsPromise = getFeatureDetails(companyId);
  const growthEventsPromise = getGrowthEvents(companyId);

  const [[factorRows], totalCount, industryData, featureDetails, growthEvents] = await Promise.all([
    factorsPromise,
    totalCountPromise,
    industryDataPromise,
    featureDetailsPromise,
    growthEventsPromise
  ]);
  const factors = factorRows.map(mapFactor);

  return {
    company,
    score: {
      ...score,
      growthRankTotal: totalCount,
      industryGrowthRankTotal: industryData.companyCount
    },
    positiveFactors: factors.filter((item) => item.direction === "positive").slice(0, 3),
    negativeFactors: factors.filter((item) => item.direction === "negative").slice(0, 3),
    featureDetails,
    industryComparison: {
      industryName: company.industry ?? "미분류",
      rank: score.industryGrowthRank,
      percentile: score.industryGrowthPercentile,
      averageScore: industryData.averageScore,
      topScore: industryData.topScore,
      rankings: industryData.rankings
    },
    growthEvents,
    dataConfidence: getDataCoverage(score)
  };
}

async function getFeatureDetails(companyId: number): Promise<DashboardData["featureDetails"]> {
  const pool = getPool();
  const [financialResult, patentResult, employmentResult, newsResult] = await Promise.all([
    pool.execute<Array<RowDataPacket & Record<string, string | number | null>>>(
      `SELECT revenue_growth_1y, operating_margin, operating_margin_change_1y,
              liabilities_to_assets, current_ratio
         FROM financial_features
        WHERE company_id = :companyId
        ORDER BY
          CASE
            WHEN revenue_growth_1y IS NOT NULL
              OR operating_margin IS NOT NULL
              OR operating_margin_change_1y IS NOT NULL
              OR liabilities_to_assets IS NOT NULL
              OR current_ratio IS NOT NULL
            THEN 0
            ELSE 1
          END,
          feature_year DESC
        LIMIT 1`,
      { companyId }
    ),
    pool.execute<Array<RowDataPacket & Record<string, string | number | null>>>(
      `SELECT patent_count_3y, patent_count_1y, unique_ipc_count, patent_momentum
         FROM patent_features
        WHERE company_id = :companyId
        ORDER BY feature_year DESC
        LIMIT 1`,
      { companyId }
    ),
    pool.execute<Array<RowDataPacket & Record<string, string | number | null>>>(
      `SELECT employee_count_latest, employee_growth_6m, net_hiring_rate_6m, employee_growth_slope
         FROM employment_features
        WHERE company_id = :companyId
        LIMIT 1`,
      { companyId }
    ),
    pool.execute<Array<RowDataPacket & Record<string, string | number | null>>>(
      `SELECT growth_event_12m_count, investment_event_24m_count, contract_event_12m_count, recent_growth_event_days
         FROM news_event_features
        WHERE company_id = :companyId
        LIMIT 1`,
      { companyId }
    )
  ]);
  const [financial] = financialResult;
  const [patent] = patentResult;
  const [employment] = employmentResult;
  const [news] = newsResult;

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

function getDataCoverage(score: GrowthScore): DashboardData["dataConfidence"] {
  return [
    coverageItem("재무", score.financialDataAvailable, score.financialScore),
    coverageItem("특허", score.patentDataAvailable, score.patentScore),
    coverageItem("고용", score.employmentDataAvailable, score.employmentScore),
    coverageItem("뉴스", score.newsEventDataAvailable, score.newsEventScore),
    coverageItem("산업", score.industryDataAvailable, score.industryScore)
  ];
}

function coverageItem(label: string, available: boolean, score: number | null) {
  return {
    label,
    value: available ? (score === null ? "유효 데이터 부족" : "평가 반영") : "데이터 미관측",
    ok: available && score !== null
  };
}

async function getGrowthScoreCompanyCount(): Promise<number | null> {
  const [rows] = await getPool().execute<CountRow[]>(
    `SELECT COUNT(*) AS count
       FROM (
         SELECT gs.company_id,
                ROW_NUMBER() OVER (
                  PARTITION BY gs.company_id
                  ORDER BY gs.is_mock ASC, gs.calculated_at DESC, gs.model_version DESC
                ) AS score_pick
           FROM growth_scores gs
       ) picked_scores
      WHERE picked_scores.score_pick = 1`
  );

  return rows[0]?.count ?? null;
}

async function getIndustryComparison(industry: string | null, companyId: number): Promise<{ averageScore: number | null; topScore: number | null; companyCount: number | null; rankings: IndustryRankingRow[] }> {
  if (!industry) return { averageScore: null, topScore: null, companyCount: null, rankings: [] };

  const [rows] = await getPool().execute<RankingRow[]>(
    `WITH picked_scores AS (
       SELECT ranked_scores.*
         FROM (
           SELECT gs.*,
                  ROW_NUMBER() OVER (
                    PARTITION BY gs.company_id
                    ORDER BY gs.is_mock ASC, gs.calculated_at DESC, gs.model_version DESC
                  ) AS score_pick
             FROM growth_scores gs
         ) ranked_scores
        WHERE ranked_scores.score_pick = 1
      ),
      ranked AS (
        SELECT c.company_id, c.company_name, picked_scores.growth_score,
               ROW_NUMBER() OVER (ORDER BY picked_scores.growth_score DESC, c.company_id ASC) AS rank_position,
               COUNT(*) OVER () AS company_count,
               AVG(picked_scores.growth_score) OVER () AS average_score,
               MAX(picked_scores.growth_score) OVER () AS top_score
          FROM companies c
          JOIN picked_scores ON picked_scores.company_id = c.company_id
         WHERE c.industry = :industry
      )
      SELECT rank_position, company_id, company_name, growth_score, company_count, average_score, top_score
        FROM ranked
       WHERE rank_position <= 3 OR company_id = :companyId
       ORDER BY rank_position`,
    { industry, companyId }
  );
  const stats = rows[0];

  return {
    averageScore: nullableNumber(stats?.average_score ?? null) === null ? null : Number(Number(stats?.average_score).toFixed(1)),
    topScore: nullableNumber(stats?.top_score ?? null) === null ? null : Number(Number(stats?.top_score).toFixed(1)),
    companyCount: stats?.company_count ?? null,
    rankings: rows.map((row) => ({
      rank: row.rank_position,
      companyId: row.company_id,
      companyName: row.company_name,
      growthScore: Number(row.growth_score),
      isCurrent: row.company_id === companyId
    }))
  };
}

export async function getIndustryTopGroups(limit = 5): Promise<IndustryTopGroup[]> {
  "use cache: remote";
  cacheTag("industry-top-groups");
  cacheLife({
    revalidate: DASHBOARD_CACHE_REVALIDATE_SECONDS,
    expire: DASHBOARD_CACHE_EXPIRE_SECONDS
  });

  if (!hasDbConfig() && shouldUseCsvFallback()) return getCsvIndustryTopGroups(limit);

  const dataNames = TOP_INDUSTRY_GROUPS.flatMap((group) => group.dataNames);
  const [rows] = await getPool().query<IndustryTopRow[]>(
    `WITH picked_scores AS (
       SELECT ranked_scores.*
         FROM (
           SELECT gs.*,
                  ROW_NUMBER() OVER (
                    PARTITION BY gs.company_id
                    ORDER BY gs.is_mock ASC, gs.calculated_at DESC, gs.model_version DESC
                  ) AS score_pick
             FROM growth_scores gs
         ) ranked_scores
        WHERE ranked_scores.score_pick = 1
      ),
      ranked AS (
        SELECT c.industry, c.company_id, c.company_name, picked_scores.growth_score,
               picked_scores.model_version, picked_scores.is_mock,
               ROW_NUMBER() OVER (
                 PARTITION BY c.industry
                 ORDER BY picked_scores.growth_score DESC, c.company_id ASC
               ) AS rank_position
          FROM companies c
          JOIN picked_scores ON picked_scores.company_id = c.company_id
         WHERE c.industry IN (?)
      )
      SELECT industry, rank_position, company_id, company_name, growth_score, model_version, is_mock
        FROM ranked
       WHERE rank_position <= ?
       ORDER BY industry, rank_position`,
    [dataNames, limit]
  );

  return TOP_INDUSTRY_GROUPS.map(({ industryName, dataNames: aliases }) => {
    const companies = rows
      .filter((row) => aliases.includes(row.industry))
      .sort((a, b) => Number(b.growth_score) - Number(a.growth_score) || a.company_id - b.company_id)
      .slice(0, limit)
      .map((row, index) => ({
        rank: index + 1,
        companyId: row.company_id,
        companyName: row.company_name,
        growthScore: Number(row.growth_score),
        modelVersion: row.model_version,
        isMock: Boolean(row.is_mock)
      }));

    return { industryName, companies };
  });
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
