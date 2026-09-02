import "server-only";
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import type {
  CompanyDetail,
  CompanySummary,
  DashboardData,
  FeatureRow,
  GrowthEvent,
  GrowthScore,
  GrowthScoreFactor,
  IndustryRankingRow,
  IndustryTopGroup,
  ScoreCategory,
  ScoreDirection
} from "@/types/company";
import { categoryDescriptions, EVENT_CONFIDENCE_THRESHOLD, FEATURE_UNAVAILABLE, featureMetadata } from "@/constants/featureMetadata";
import { formatFeatureValue, normalizeSearchName, toNullableNumber } from "@/utils/format";
import { classifyFactorSignal } from "@/utils/signals";

type CsvRow = Record<string, string>;

const sourceDir = path.join(process.cwd(), "data", "source");
const rawNewsFile = "news_growth_event_raw.csv";

let cache: {
  companies: CompanyDetail[];
  byId: Map<number, CompanyDetail>;
  rows: Record<ScoreCategory, Map<number, CsvRow>>;
} | null = null;

let rawEventCache: Map<number, GrowthEvent[]> | null = null;

export const TOP_INDUSTRY_GROUPS = [
  { industryName: "ICT·AI·SW", dataNames: ["ICT·AI·SW"] },
  { industryName: "로봇·모빌리티·첨단제조", dataNames: ["로봇·모빌리티·첨단제조"] },
  { industryName: "바이오·헬스케어", dataNames: ["바이오·헬스케어"] },
  { industryName: "반도체·ICT HW", dataNames: ["반도체·ICT HW"] },
  { industryName: "에너지·클라이밋테크", dataNames: ["에너지·클라이밋테크", "에너지·Climate Tech"] },
  { industryName: "콘텐츠·미디어", dataNames: ["콘텐츠·미디어"] }
];

export const TOP_INDUSTRIES = TOP_INDUSTRY_GROUPS.map((group) => group.industryName);

function readCsv(fileName: string): CsvRow[] {
  const content = fs.readFileSync(path.join(sourceDir, fileName), "utf8");
  return parse(content, { columns: true, skip_empty_lines: true, bom: true, trim: true }) as CsvRow[];
}

function latestByCompany(rows: CsvRow[]): Map<number, CsvRow> {
  const map = new Map<number, CsvRow>();

  for (const row of rows) {
    const companyId = Number(row.company_id);
    if (!Number.isFinite(companyId)) continue;

    const current = map.get(companyId);
    if (!current || Number(row.feature_year ?? 0) >= Number(current.feature_year ?? 0)) {
      map.set(companyId, row);
    }
  }

  return map;
}

function loadData() {
  if (cache) return cache;

  const selected = readCsv("companies_300.csv");
  const basic = latestByCompany(readCsv("company_basic_features.csv"));
  const rows: Record<ScoreCategory, Map<number, CsvRow>> = {
    financial: latestByCompany(readCsv("financial_features.csv")),
    patent: latestByCompany(readCsv("patent_features.csv")),
    employment: latestByCompany(readCsv("organization_employment_features.csv")),
    news_event: latestByCompany(readCsv("news_growth_event_features.csv")),
    industry: new Map<number, CsvRow>()
  };

  const companies = selected
    .map((row) => {
      const companyId = Number(row.company_id);
      if (!Number.isFinite(companyId)) return null;

      const basicRow = basic.get(companyId);
      const company: CompanyDetail = {
        companyId,
        companyName: row.company_name || `기업 ${companyId}`,
        industry: basicRow?.industry || row.industry || null,
        subIndustry: basicRow?.sub_industry || row.sub_industry || null,
        region: basicRow?.region || row.region || null,
        ventureType: basicRow?.venture_type || row.venture_type || null,
        foundedYear: toNullableNumber(basicRow?.founded_year ?? row.founded_year),
        companyAge: toNullableNumber(basicRow?.company_age ?? row.company_age),
        ventureRenewal: basicRow?.venture_renewal || row.venture_renewal || null,
        macroRegion: basicRow?.macro_region || row.macro_region || null,
        idConfidence: basicRow?.id_confidence || row.name_uniqueness || null,
        hasDart: basicRow?.has_dart ? basicRow.has_dart === "1" : null
      };

      return company;
    })
    .filter((company): company is CompanyDetail => company !== null);

  cache = {
    companies,
    byId: new Map(companies.map((company) => [company.companyId, company])),
    rows
  };

  return cache;
}

function seeded(companyId: number, salt: number): number {
  const x = Math.sin(companyId * 999 + salt * 97) * 10000;
  return x - Math.floor(x);
}

function scoreForRaw(companyId: number): number {
  const parts = [1, 2, 3, 4, 5].map((salt) => Math.round(45 + seeded(companyId, salt) * 50));
  return parts[0] * 0.28 + parts[1] * 0.2 + parts[2] * 0.2 + parts[3] * 0.18 + parts[4] * 0.14;
}

function valueOf(row: CsvRow | undefined, key: string): string | null {
  const value = row?.[key];
  return value === undefined || value === "" ? null : value;
}

function scoreFor(company: CompanyDetail): GrowthScore {
  const data = loadData();
  const financial = data.rows.financial.get(company.companyId);
  const patent = data.rows.patent.get(company.companyId);
  const employment = data.rows.employment.get(company.companyId);
  const news = data.rows.news_event.get(company.companyId);
  const financialDataAvailable = Boolean(financial && valueOf(financial, "has_financial") === "1");
  const patentDataAvailable = Boolean(patent && valueOf(patent, "has_patent") === "1");
  const employmentDataAvailable = Boolean(employment);
  const newsEventDataAvailable = Boolean(news && valueOf(news, "news_observability_flag") === "1");
  const industryDataAvailable = Boolean(company.industry);
  const financialScore = Math.round(45 + seeded(company.companyId, 1) * 50);
  const patentScore = Math.round(45 + seeded(company.companyId, 2) * 50);
  const employmentScore = Math.round(45 + seeded(company.companyId, 3) * 50);
  const newsEventScore = Math.round(45 + seeded(company.companyId, 4) * 50);
  const industryScore = Math.round(45 + seeded(company.companyId, 5) * 50);
  const growthScore = Number((financialScore * 0.28 + patentScore * 0.2 + employmentScore * 0.2 + newsEventScore * 0.18 + industryScore * 0.14).toFixed(1));
  const sorted = data.companies.map((item) => ({ id: item.companyId, score: scoreForRaw(item.companyId) })).sort((a, b) => b.score - a.score);
  const rank = sorted.findIndex((item) => item.id === company.companyId) + 1;
  const peers = data.companies.filter((item) => item.industry === company.industry);
  const peerSorted = peers.map((item) => ({ id: item.companyId, score: scoreForRaw(item.companyId) })).sort((a, b) => b.score - a.score);
  const industryRank = peerSorted.findIndex((item) => item.id === company.companyId) + 1;

  return {
    companyId: company.companyId,
    growthScore,
    growthGrade: growthScore >= 85 ? "A" : growthScore >= 75 ? "B" : "C",
    growthRank: rank,
    growthPercentile: Math.max(1, Math.round((rank / Math.max(sorted.length, 1)) * 100)),
    industryGrowthRank: industryRank,
    industryGrowthPercentile: Math.max(1, Math.round((industryRank / Math.max(peerSorted.length, 1)) * 100)),
    financialScore,
    patentScore,
    employmentScore,
    newsEventScore,
    industryScore,
    financialDataAvailable,
    patentDataAvailable,
    employmentDataAvailable,
    newsEventDataAvailable,
    industryDataAvailable,
    coverageScore: [
      financialDataAvailable,
      patentDataAvailable,
      employmentDataAvailable,
      newsEventDataAvailable,
      industryDataAvailable
    ].filter(Boolean).length / 5,
    modelVersion: "mock-v1",
    calculatedAt: new Date().toISOString(),
    isMock: true
  };
}

function featureRow(row: CsvRow | undefined, key: string): FeatureRow {
  const metadata = featureMetadata[key];

  return {
    label: metadata?.label ?? key,
    description: metadata?.description ?? "해당 Feature의 관측값입니다.",
    value: formatFeatureValue(key, valueOf(row, key))
  };
}

function signal(
  category: ScoreCategory,
  featureName: string,
  featureValue: string | number | null,
  contribution: number,
  displayOrder: number
): GrowthScoreFactor | null {
  const modelDirection: ScoreDirection = contribution > 0 ? "positive" : contribution < 0 ? "negative" : "positive";
  const direction = classifyFactorSignal(featureName, featureValue, modelDirection, contribution);
  if (!direction) return null;

  const metadata = featureMetadata[featureName];
  const valueText = formatFeatureValue(featureName, featureValue);
  const label = metadata?.label ?? featureName;
  const description = valueText === FEATURE_UNAVAILABLE ? "관측 가능한 값이 충분하지 않습니다." : `${label} ${valueText}`;

  return {
    category,
    featureName,
    featureValue,
    contribution: Number(Math.abs(contribution / 10).toFixed(2)),
    direction,
    description,
    valueText,
    displayOrder
  };
}

function factorsFor(companyId: number, score: GrowthScore): GrowthScoreFactor[] {
  const data = loadData();
  const financial = data.rows.financial.get(companyId);
  const patent = data.rows.patent.get(companyId);
  const employment = data.rows.employment.get(companyId);
  const news = data.rows.news_event.get(companyId);
  const byScore = (
    category: ScoreCategory,
    featureName: string,
    featureValue: string | number | null,
    scoreValue: number | null,
    baseline: number,
    displayOrder: number,
    invert = false
  ) => {
    if (scoreValue === null) return null;
    const contribution = invert ? baseline - scoreValue : scoreValue - baseline;
    return signal(category, featureName, featureValue, contribution, displayOrder);
  };

  return [
    byScore("financial", "revenue_growth_1y", valueOf(financial, "revenue_growth_1y"), score.financialScore, 65, 1),
    byScore("patent", "patent_count_3y", valueOf(patent, "patent_count_3y"), score.patentScore, 65, 2),
    byScore("employment", "employee_growth_6m", valueOf(employment, "employee_growth_6m"), score.employmentScore, 65, 3),
    byScore("news_event", "investment_event_24m_count", valueOf(news, "investment_event_24m_count"), score.newsEventScore, 65, 4),
    byScore("financial", "liabilities_to_assets", valueOf(financial, "liabilities_to_assets"), score.financialScore, 65, 5, true),
    byScore("financial", "operating_margin_change_1y", valueOf(financial, "operating_margin_change_1y"), score.financialScore, 72, 6)
  ].filter((item): item is GrowthScoreFactor => item !== null);
}

function coverageItems(score: GrowthScore): DashboardData["dataConfidence"] {
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

function buildRankings(company: CompanyDetail): { rows: IndustryRankingRow[]; averageScore: number | null; topScore: number | null } {
  const data = loadData();
  const peers = data.companies
    .filter((item) => item.industry === company.industry)
    .map((item) => ({ company: item, score: Number(scoreForRaw(item.companyId).toFixed(1)) }))
    .sort((a, b) => b.score - a.score);
  const averageScore = peers.length ? Number((peers.reduce((sum, item) => sum + item.score, 0) / peers.length).toFixed(1)) : null;
  const topScore = peers[0]?.score ?? null;
  const currentRank = peers.findIndex((item) => item.company.companyId === company.companyId) + 1;
  const topRows = peers.slice(0, 3).map((item, index) => rankingRow(item.company, item.score, index + 1, item.company.companyId === company.companyId));
  const current = peers[currentRank - 1];
  const rows = currentRank > 3 && current ? [...topRows, rankingRow(current.company, current.score, currentRank, true)] : topRows;

  return { rows, averageScore, topScore };
}

function rankingRow(company: CompanyDetail, growthScore: number, rank: number, isCurrent: boolean): IndustryRankingRow {
  return { rank, companyId: company.companyId, companyName: company.companyName, growthScore, isCurrent };
}

function truthy(value: string | undefined): boolean {
  return ["true", "1", "yes", "y"].includes((value ?? "").toLowerCase());
}

function loadRawEvents(): Map<number, GrowthEvent[]> {
  if (rawEventCache) return rawEventCache;

  rawEventCache = new Map();
  const filePath = path.join(sourceDir, rawNewsFile);
  if (!fs.existsSync(filePath)) return rawEventCache;

  for (const row of readCsv(rawNewsFile)) {
    if (!isValidEvent(row)) continue;

    const companyId = Number(row.company_id);
    const event: GrowthEvent = {
      eventId: `${companyId}-${row.published_at}-${row.original_link || row.naver_link || row.news_title}`,
      publishedAt: row.published_at,
      eventType: row.event_type,
      eventDirection: parseDirection(row.event_direction),
      eventIntensity: toNullableNumber(row.event_intensity),
      eventConfidence: toNullableNumber(row.event_confidence),
      newsTitle: row.news_title,
      eventSummary: row.event_summary || row.news_description || null,
      sourceDomain: row.source_domain || null,
      href: row.original_link || row.naver_link || null
    };
    const events = rawEventCache.get(companyId) ?? [];
    events.push(event);
    rawEventCache.set(companyId, events);
  }

  for (const [companyId, events] of rawEventCache.entries()) {
    rawEventCache.set(
      companyId,
      events
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, 5)
    );
  }

  return rawEventCache;
}

function isValidEvent(row: CsvRow): boolean {
  const confidence = toNullableNumber(row.event_confidence);

  return (
    truthy(row.valid_news_flag) &&
    truthy(row.company_match) &&
    !truthy(row.duplicate_flag) &&
    !truthy(row.outside_window_flag) &&
    Boolean(row.event_type) &&
    (confidence === null || confidence >= EVENT_CONFIDENCE_THRESHOLD)
  );
}

function parseDirection(value: string): GrowthEvent["eventDirection"] {
  if (value === "positive" || value === "negative") return value;
  return "neutral";
}

export async function searchCsvCompanies(search: string): Promise<CompanySummary[]> {
  const data = loadData();
  const normalized = normalizeSearchName(search);
  if (normalized.length < 2) return data.companies.slice(0, 6);

  return data.companies
    .filter((company) => normalizeSearchName(company.companyName).includes(normalized))
    .slice(0, 50);
}

export async function getCsvFeaturedCompanies(limit: number): Promise<CompanySummary[]> {
  return loadData().companies.slice(0, limit);
}

export async function getCsvCompany(companyId: number): Promise<CompanyDetail | null> {
  return loadData().byId.get(companyId) ?? null;
}

export async function getCsvIndustryTopGroups(limit: number): Promise<IndustryTopGroup[]> {
  const data = loadData();

  return TOP_INDUSTRY_GROUPS.map(({ industryName, dataNames }) => {
    const companies = data.companies
      .filter((company) => Boolean(company.industry && dataNames.includes(company.industry)))
      .map((company) => ({ company, score: scoreFor(company) }))
      .sort((a, b) => b.score.growthScore - a.score.growthScore || a.company.companyId - b.company.companyId)
      .slice(0, limit)
      .map(({ company, score }, index) => ({
        rank: index + 1,
        companyId: company.companyId,
        companyName: company.companyName,
        growthScore: score.growthScore,
        modelVersion: score.modelVersion,
        isMock: score.isMock
      }));

    return { industryName, companies };
  });
}

export async function getCsvDashboard(companyId: number): Promise<DashboardData | null> {
  const data = loadData();
  const company = data.byId.get(companyId);
  if (!company) return null;

  const score = scoreFor(company);
  const financial = data.rows.financial.get(companyId);
  const patent = data.rows.patent.get(companyId);
  const employment = data.rows.employment.get(companyId);
  const news = data.rows.news_event.get(companyId);
  const allFactors = factorsFor(companyId, score);
  const ranking = buildRankings(company);

  return {
    company,
    score,
    positiveFactors: allFactors.filter((item) => item.direction === "positive").slice(0, 3),
    negativeFactors: allFactors.filter((item) => item.direction === "negative").slice(0, 3),
    featureDetails: {
      financial: ["revenue_growth_1y", "operating_margin", "operating_margin_change_1y", "liabilities_to_assets", "current_ratio"].map((key) => featureRow(financial, key)),
      patent: ["patent_count_3y", "patent_count_1y", "unique_ipc_count", "patent_momentum"].map((key) => featureRow(patent, key)),
      employment: ["employee_count_latest", "employee_growth_6m", "net_hiring_rate_6m", "employee_growth_slope"].map((key) => featureRow(employment, key)),
      news_event: ["growth_event_12m_count", "investment_event_24m_count", "contract_event_12m_count", "recent_growth_event_days"].map((key) => featureRow(news, key)),
      industry: []
    },
    industryComparison: {
      industryName: company.industry ?? "미분류",
      rank: score.industryGrowthRank,
      percentile: score.industryGrowthPercentile,
      averageScore: ranking.averageScore,
      topScore: ranking.topScore,
      rankings: ranking.rows
    },
    growthEvents: loadRawEvents().get(companyId) ?? [],
    dataConfidence: coverageItems(score)
  };
}

export { categoryDescriptions };
