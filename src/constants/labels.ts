import type { ScoreCategory } from "@/types/company";

export const categoryLabels: Record<ScoreCategory, string> = {
  financial: "재무 성장성",
  patent: "특허·기술",
  employment: "조직·고용",
  news_event: "Growth Event",
  industry: "산업·시장"
};

export const featureLabels: Record<string, string> = {
  revenue_growth_1y: "최근 1년 매출 성장률",
  revenue_cagr_3y: "최근 3년 매출 CAGR",
  operating_margin: "영업이익률",
  liabilities_to_assets: "자산 대비 부채 비율",
  current_ratio: "유동비율",
  patent_momentum: "특허 출원 모멘텀",
  patent_count_3y: "최근 3년 특허 수",
  patent_count_1y: "최근 1년 특허 수",
  unique_ipc_count: "기술 분류 다양성",
  employee_count_latest: "최근 직원 수",
  employee_growth_6m: "최근 6개월 직원 증가율",
  net_hiring_rate_6m: "최근 6개월 순고용률",
  growth_event_12m_count: "최근 12개월 성장 이벤트",
  investment_event_24m_count: "최근 24개월 투자 이벤트",
  contract_event_12m_count: "최근 12개월 계약 이벤트",
  industry_revenue_growth_1y: "산업 매출 성장률",
  industry_employee_growth_1y: "산업 고용 성장률",
  industry_startup_rate_latest: "산업 창업률"
};
