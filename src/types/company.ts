export type ScoreDirection = "positive" | "negative";
export type ScoreCategory = "financial" | "patent" | "employment" | "news_event" | "industry";

export interface CompanySummary {
  companyId: number;
  companyName: string;
  industry: string | null;
  subIndustry: string | null;
  region: string | null;
  ventureType: string | null;
}

export interface CompanyDetail extends CompanySummary {
  foundedYear: number | null;
  companyAge: number | null;
  ventureRenewal: string | null;
  macroRegion: string | null;
  idConfidence: string | null;
  hasDart: boolean | null;
}

export interface GrowthScore {
  companyId: number;
  growthScore: number;
  growthGrade: string;
  growthRank: number;
  growthPercentile: number;
  industryGrowthRank: number | null;
  industryGrowthPercentile: number | null;
  financialScore: number;
  patentScore: number;
  employmentScore: number;
  newsEventScore: number;
  industryScore: number;
  modelVersion: string;
  calculatedAt: string;
  isMock: boolean;
}

export interface GrowthScoreFactor {
  category: ScoreCategory;
  featureName: string;
  featureValue: string | number | null;
  contribution: number;
  direction: ScoreDirection;
  description: string;
  valueText: string;
  displayOrder: number;
}

export interface FeatureRow {
  label: string;
  description: string;
  value: string;
}

export interface IndustryRankingRow {
  rank: number;
  companyId: number;
  companyName: string;
  growthScore: number;
  isCurrent: boolean;
}

export interface IndustryComparison {
  industryName: string;
  rank: number | null;
  percentile: number | null;
  averageScore: number | null;
  topScore: number | null;
  rankings: IndustryRankingRow[];
}

export interface GrowthEvent {
  eventId: string;
  publishedAt: string;
  eventType: string;
  eventDirection: "positive" | "neutral" | "negative";
  eventIntensity: number | null;
  eventConfidence: number | null;
  newsTitle: string;
  eventSummary: string | null;
  sourceDomain: string | null;
  href: string | null;
}

export interface DataConfidenceItem {
  label: string;
  value: string;
  ok: boolean;
}

export interface DashboardData {
  company: CompanyDetail;
  score: GrowthScore;
  positiveFactors: GrowthScoreFactor[];
  negativeFactors: GrowthScoreFactor[];
  featureDetails: Record<ScoreCategory, FeatureRow[]>;
  industryComparison: IndustryComparison;
  growthEvents: GrowthEvent[];
  dataConfidence: DataConfidenceItem[];
}
