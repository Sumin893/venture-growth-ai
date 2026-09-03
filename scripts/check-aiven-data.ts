import { getPool } from "./shared";

async function main() {
  const pool = getPool();

  const [rows] = await pool.query(`
    SELECT 'companies' AS table_name, COUNT(*) AS cnt FROM companies
    UNION ALL
    SELECT 'company_features', COUNT(*) FROM company_features
    UNION ALL
    SELECT 'financial_features', COUNT(*) FROM financial_features
    UNION ALL
    SELECT 'patent_features', COUNT(*) FROM patent_features
    UNION ALL
    SELECT 'employment_features', COUNT(*) FROM employment_features
    UNION ALL
    SELECT 'news_event_features', COUNT(*) FROM news_event_features
    UNION ALL
    SELECT 'industry_features', COUNT(*) FROM industry_features
    UNION ALL
    SELECT 'growth_events', COUNT(*) FROM growth_events
    UNION ALL
    SELECT 'growth_scores', COUNT(*) FROM growth_scores
    UNION ALL
    SELECT 'growth_score_factors', COUNT(*) FROM growth_score_factors
  `);

  console.table(rows);

  const [scoreSummary] = await pool.query(`
    SELECT
      model_version,
      is_mock,
      COUNT(*) AS cnt,
      MIN(growth_score) AS min_score,
      MAX(growth_score) AS max_score
    FROM growth_scores
    GROUP BY model_version, is_mock
  `);

  console.table(scoreSummary);

  const [sample] = await pool.query(`
    SELECT
      company_id,
      growth_score,
      growth_grade,
      growth_rank,
      growth_percentile,
      financial_score,
      patent_score,
      employment_score,
      news_event_score,
      industry_score,
      coverage_score,
      model_version,
      is_mock
    FROM growth_scores
    WHERE company_id = 78
  `);

  console.table(sample);

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});