import { getPool, nullable, readCsv, upsert } from "./shared";

type FactorCategory =
  | "financial"
  | "patent"
  | "employment"
  | "news_event"
  | "industry";

type Factor = [
  category: FactorCategory,
  featureName: string,
  featureValue: string | number | null,
  description: string,
  contributionBase: number
];

const industryCodeMap: Record<string, string> = {
  "ICT·AI·SW": "ict_ai_sw",
  "로보틱스·모빌리티·첨단제조":
    "robotics_mobility_advanced_manufacturing",
  "바이오·헬스케어": "bio_healthcare",
  "반도체·ICT HW": "semiconductor_ict_hw",
  "에너지·클라이밋테크": "energy_climate_tech",
  "콘텐츠·미디어": "content_media"
};

function seeded(companyId: number, salt: number): number {
  const x = Math.sin(companyId * 999 + salt * 97) * 10000;
  return x - Math.floor(x);
}

function dimension(companyId: number, salt: number) {
  return Math.round(40 + seeded(companyId, salt) * 55);
}

async function main() {
  const companies = readCsv("companies_300.csv").map((row) => ({
    companyId: Number(row.company_id),
    industry: row.industry || "미분류"
  }));

  const scores = companies
    .map((company) => {
      const financial = dimension(company.companyId, 1);
      const patent = dimension(company.companyId, 2);
      const employment = dimension(company.companyId, 3);
      const news = dimension(company.companyId, 4);
      const industryScore = dimension(company.companyId, 5);

      const growth = Number(
        (
          financial * 0.28 +
          patent * 0.2 +
          employment * 0.2 +
          news * 0.18 +
          industryScore * 0.14
        ).toFixed(1)
      );

      return {
        ...company,
        financial,
        patent,
        employment,
        news,
        industryScore,
        growth
      };
    })
    .sort((a, b) => b.growth - a.growth);

  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    for (const score of scores) {
      const rank =
        scores.findIndex((item) => item.companyId === score.companyId) + 1;

      const peers = scores
        .filter((item) => item.industry === score.industry)
        .sort((a, b) => b.growth - a.growth);

      const industryRank =
        peers.findIndex((item) => item.companyId === score.companyId) + 1;

      await upsert(
        connection,
        "growth_scores",
        {
          company_id: score.companyId,
          growth_score: score.growth,
          growth_grade:
            score.growth >= 85 ? "A" : score.growth >= 75 ? "B" : "C",
          growth_rank: rank,
          industry_growth_rank: industryRank,

          growth_percentile: Math.max(
            1,
            Math.round(
              ((scores.length - rank + 1) / scores.length) * 100
            )
          ),

          industry_growth_percentile: Math.max(
            1,
            Math.round(
              ((peers.length - industryRank + 1) / peers.length) * 100
            )
          ),

          financial_score: score.financial,
          patent_score: score.patent,
          employment_score: score.employment,
          news_event_score: score.news,
          industry_score: score.industryScore,
          model_version: "mock-v1",
          calculated_at: new Date()
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          is_mock: 1
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
          "calculated_at",
          "is_mock"
        ]
      );

      /*
       * Growth Signal / Risk Signal에 표시할 실제 Feature 값을
       * 각 Feature 테이블에서 조회한다.
       */
      const [featureRows] = await connection.execute<any[]>(
        `
        SELECT
          (
            SELECT revenue_growth_1y
            FROM financial_features
            WHERE company_id = ?
            ORDER BY feature_year DESC
            LIMIT 1
          ) AS revenue_growth_1y,

          (
            SELECT patent_count_3y
            FROM patent_features
            WHERE company_id = ?
            ORDER BY feature_year DESC
            LIMIT 1
          ) AS patent_count_3y,

          (
            SELECT employee_growth_6m
            FROM employment_features
            WHERE company_id = ?
            LIMIT 1
          ) AS employee_growth_6m,

          (
            SELECT investment_event_24m_count
            FROM news_event_features
            WHERE company_id = ?
            LIMIT 1
          ) AS investment_event_24m_count
        `,
        [
          score.companyId,
          score.companyId,
          score.companyId,
          score.companyId
        ]
      );

      const actual = featureRows[0] ?? {};

      /*
       * companies.industry의 한글 산업군명을
       * industry_features.industry_group_code와 연결한다.
       */
      const industryCode = industryCodeMap[score.industry];

      let actualIndustryRevenueGrowth: string | number | null = null;

      if (industryCode) {
        const [industryRows] = await connection.execute<any[]>(
          `
          SELECT industry_revenue_growth_1y
          FROM industry_features
          WHERE industry_group_code = ?
          LIMIT 1
          `,
          [industryCode]
        );

        actualIndustryRevenueGrowth =
          industryRows[0]?.industry_revenue_growth_1y ?? null;
      }

      /*
       * 기존 mock-v1 Factor를 삭제하고 다시 생성한다.
       */
      await connection.execute(
        `
        DELETE FROM growth_score_factors
        WHERE company_id = ?
          AND model_version = 'mock-v1'
        `,
        [score.companyId]
      );

      /*
       * featureValue:
       *   실제 Feature 값
       *
       * contributionBase:
       *   Mock Score에서 양/음의 기여 방향을 만들기 위한 임시 값
       *
       * 두 값을 반드시 분리해서 저장한다.
       */
      const factors: Factor[] = [
        [
          "financial",
          "revenue_growth_1y",
          actual.revenue_growth_1y ?? null,
          "최근 매출 성장률이 재무 성장 신호로 반영되었습니다.",
          score.financial - 65
        ],
        [
          "patent",
          "patent_count_3y",
          actual.patent_count_3y ?? null,
          "최근 특허 활동이 기술 성장 신호로 반영되었습니다.",
          score.patent - 65
        ],
        [
          "employment",
          "employee_growth_6m",
          actual.employee_growth_6m ?? null,
          "최근 고용 변화가 조직 성장 신호로 반영되었습니다.",
          score.employment - 65
        ],
        [
          "news_event",
          "investment_event_24m_count",
          actual.investment_event_24m_count ?? null,
          "최근 투자 이벤트가 외부 성장 신호로 반영되었습니다.",
          score.news - 65
        ],
        [
          "industry",
          "industry_revenue_growth_1y",
          actualIndustryRevenueGrowth,
          "산업 매출 성장률이 시장 환경 신호로 반영되었습니다.",
          score.industryScore - 65
        ]
      ];

      for (const [index, factor] of factors.entries()) {
        const [
          category,
          featureName,
          featureValue,
          description,
          contributionBase
        ] = factor;

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
          VALUES (?, 'mock-v1', ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            score.companyId,
            category,
            featureName,
            featureValue === null
              ? null
              : nullable(String(featureValue)),
            Math.abs(contributionBase / 10),
            contributionBase >= 0 ? "positive" : "negative",
            description,
            index + 1
          ]
        );
      }
    }

    await connection.commit();

    console.log(
      `Generated deterministic mock-v1 scores for ${scores.length} companies.`
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