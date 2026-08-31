import { getPool, nullable, readCsv, upsert } from "./shared";

function seeded(companyId: number, salt: number): number {
  const x = Math.sin(companyId * 999 + salt * 97) * 10000;
  return x - Math.floor(x);
}

function dimension(companyId: number, salt: number) {
  return Math.round(40 + seeded(companyId, salt) * 55);
}

async function main() {
  const companies = readCsv("companies_300.csv").map((row) => ({
    companyId: Number(row["선정번호"]),
    industry: row["산업"] || "미분류"
  }));
  const scores = companies.map((company) => {
    const financial = dimension(company.companyId, 1);
    const patent = dimension(company.companyId, 2);
    const employment = dimension(company.companyId, 3);
    const news = dimension(company.companyId, 4);
    const industryScore = dimension(company.companyId, 5);
    const growth = Number((financial * 0.28 + patent * 0.2 + employment * 0.2 + news * 0.18 + industryScore * 0.14).toFixed(1));
    return { ...company, financial, patent, employment, news, industryScore, growth };
  }).sort((a, b) => b.growth - a.growth);

  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const score of scores) {
      const rank = scores.findIndex((item) => item.companyId === score.companyId) + 1;
      const peers = scores.filter((item) => item.industry === score.industry).sort((a, b) => b.growth - a.growth);
      const industryRank = peers.findIndex((item) => item.companyId === score.companyId) + 1;
      await upsert(connection, "growth_scores", {
        company_id: score.companyId,
        growth_score: score.growth,
        growth_grade: score.growth >= 85 ? "A" : score.growth >= 75 ? "B" : "C",
        growth_rank: rank,
        growth_percentile: Math.max(1, Math.round((rank / scores.length) * 100)),
        industry_growth_rank: industryRank,
        industry_growth_percentile: Math.max(1, Math.round((industryRank / peers.length) * 100)),
        financial_score: score.financial,
        patent_score: score.patent,
        employment_score: score.employment,
        news_event_score: score.news,
        industry_score: score.industryScore,
        model_version: "mock-v1",
        calculated_at: new Date().toISOString().slice(0, 19).replace("T", " "),
        is_mock: 1
      }, ["growth_score", "growth_grade", "growth_rank", "growth_percentile", "industry_growth_rank", "industry_growth_percentile", "financial_score", "patent_score", "employment_score", "news_event_score", "industry_score", "calculated_at", "is_mock"]);
      await connection.execute("DELETE FROM growth_score_factors WHERE company_id = ? AND model_version = 'mock-v1'", [score.companyId]);
      const factors = [
        ["financial", "revenue_growth_1y", score.financial - 65, "재무 성장 지표가 점수에 반영되었습니다."],
        ["patent", "patent_count_3y", score.patent - 65, "특허 활동성이 기술 성장 신호로 반영되었습니다."],
        ["employment", "employee_growth_6m", score.employment - 65, "고용 변화가 조직 확장 신호로 반영되었습니다."],
        ["news_event", "investment_event_24m_count", score.news - 65, "투자 및 계약 이벤트가 외부 성장 신호로 반영되었습니다."],
        ["industry", "industry_revenue_growth_1y", score.industryScore - 65, "산업 성장성이 시장 환경 점수에 반영되었습니다."]
      ];
      for (const [index, factor] of factors.entries()) {
        await connection.execute(
          `INSERT INTO growth_score_factors
           (company_id, model_version, category, feature_name, feature_value, contribution, direction, description, display_order)
           VALUES (?, 'mock-v1', ?, ?, ?, ?, ?, ?, ?)`,
          [score.companyId, factor[0], factor[1], nullable(String(factor[2])), Math.abs(Number(factor[2]) / 10), Number(factor[2]) >= 0 ? "positive" : "negative", factor[3], index + 1]
        );
      }
    }
    await connection.commit();
    console.log(`Generated deterministic mock-v1 scores for ${scores.length} companies.`);
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
