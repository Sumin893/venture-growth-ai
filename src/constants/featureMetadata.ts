export type FeatureFormat =
  | "percentage"
  | "percentagePoint"
  | "count"
  | "people"
  | "years"
  | "ratio"
  | "score"
  | "days"
  | "decimal";

export interface FeatureMetadata {
  label: string;
  unit?: string;
  description: string;
  format: FeatureFormat;
}

export const featureMetadata: Record<string, FeatureMetadata> = {
  revenue_growth_1y: {
    label: "최근 1년 매출 성장률",
    unit: "%",
    description: "직전 연도 대비 매출이 얼마나 증가했거나 감소했는지 나타냅니다.",
    format: "percentage"
  },
  revenue_cagr_3y: {
    label: "최근 3년 매출 CAGR",
    unit: "%",
    description: "최근 3년 매출의 연평균 성장 흐름을 보여줍니다.",
    format: "percentage"
  },
  operating_margin: {
    label: "영업이익률",
    unit: "%",
    description: "매출 대비 영업이익의 비율로 수익성을 확인합니다.",
    format: "percentage"
  },
  operating_margin_change_1y: {
    label: "영업이익률 변화",
    unit: "%p",
    description: "전년 대비 영업이익률이 얼마나 개선되거나 악화됐는지 나타냅니다.",
    format: "percentagePoint"
  },
  liabilities_to_assets: {
    label: "자산 대비 부채 비율",
    unit: "%",
    description: "총자산 대비 부채 규모를 통해 재무 안정성을 점검합니다.",
    format: "percentage"
  },
  current_ratio: {
    label: "유동비율",
    description: "단기 부채를 감당할 수 있는 유동자산 여력을 나타냅니다.",
    format: "ratio"
  },
  patent_momentum: {
    label: "특허 출원 모멘텀",
    description: "최근 특허 활동이 과거 대비 얼마나 활발한지 보여줍니다.",
    format: "decimal"
  },
  patent_count_3y: {
    label: "최근 3년 특허 수",
    unit: "건",
    description: "최근 3년 동안 확인된 특허 활동 규모입니다.",
    format: "count"
  },
  patent_count_1y: {
    label: "최근 1년 특허 수",
    unit: "건",
    description: "최근 1년 동안 확인된 특허 활동 규모입니다.",
    format: "count"
  },
  unique_ipc_count: {
    label: "기술 분류 다양성",
    unit: "개",
    description: "특허가 포괄하는 IPC 기술 분류의 다양성을 나타냅니다.",
    format: "count"
  },
  employee_count_latest: {
    label: "최근 직원 수",
    unit: "명",
    description: "NPS 기반으로 관측된 최신 직원 규모입니다.",
    format: "people"
  },
  employee_growth_6m: {
    label: "최근 6개월 직원 증가율",
    unit: "%",
    description: "최근 6개월 기준 직원 수의 증가·감소 비율입니다.",
    format: "percentage"
  },
  net_hiring_rate_6m: {
    label: "최근 6개월 순고용률",
    unit: "%",
    description: "입사자와 퇴사자의 차이를 평균 직원 수로 보정한 값입니다.",
    format: "percentage"
  },
  employee_growth_slope: {
    label: "고용 성장 추세",
    description: "월별 직원 수 변화가 증가 방향인지 감소 방향인지 보여줍니다.",
    format: "decimal"
  },
  growth_event_12m_count: {
    label: "최근 12개월 성장 이벤트",
    unit: "건",
    description: "최근 12개월 동안 관측된 성장 관련 뉴스 이벤트 수입니다.",
    format: "count"
  },
  investment_event_24m_count: {
    label: "최근 24개월 투자 이벤트",
    unit: "건",
    description: "최근 24개월 동안 관측된 투자 관련 성장 이벤트 수입니다.",
    format: "count"
  },
  contract_event_12m_count: {
    label: "최근 12개월 계약 이벤트",
    unit: "건",
    description: "최근 12개월 동안 관측된 계약·수주 관련 이벤트 수입니다.",
    format: "count"
  },
  recent_growth_event_days: {
    label: "최근 성장 이벤트 경과일",
    unit: "일",
    description: "가장 최근 성장 이벤트가 관측된 후 경과한 일수입니다.",
    format: "days"
  },
  industry_revenue_growth_1y: {
    label: "산업 매출 성장률",
    unit: "%",
    description: "해당 산업군의 최근 매출 성장 환경입니다.",
    format: "percentage"
  },
  industry_employee_growth_1y: {
    label: "산업 고용 성장률",
    unit: "%",
    description: "해당 산업군의 최근 고용 성장 환경입니다.",
    format: "percentage"
  },
  industry_startup_rate_latest: {
    label: "산업 창업률",
    unit: "%",
    description: "해당 산업군의 최근 창업 활동 수준입니다.",
    format: "percentage"
  }
};

export const categoryDescriptions = {
  financial: "매출·자산 성장과 수익성·재무 안정성의 변화를 통해 기업의 재무 성장 흐름을 평가합니다.",
  patent: "최근 특허 활동과 기술 영역 확장을 통해 기업의 기술 혁신 모멘텀을 평가합니다.",
  employment: "직원 수 변화와 신규 고용 흐름을 통해 조직 확장 속도와 고용 안정성을 평가합니다.",
  news_event: "투자·수주·R&D·사업 확장 등 최근 외부 성장 이벤트를 통해 현재 성장 모멘텀을 평가합니다.",
  industry: "산업의 매출·고용·기업 수·R&D 및 창업 활동을 통해 기업이 속한 시장 환경의 성장성을 평가합니다."
} as const;

export const FEATURE_UNAVAILABLE = "확인 불가";

export const EVENT_CONFIDENCE_THRESHOLD = 0.55;
