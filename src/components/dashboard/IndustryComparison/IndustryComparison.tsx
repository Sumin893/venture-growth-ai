import Link from "next/link";
import { Badge } from "@/components/common/Badge/Badge";
import { Card } from "@/components/common/Card/Card";
import type { IndustryComparison as IndustryComparisonData } from "@/types/company";
import { formatCompanyDisplayName } from "@/utils/format";
import styles from "./IndustryComparison.module.css";

export function IndustryComparison({ comparison }: { comparison: IndustryComparisonData }) {
  return (
    <Card className={styles.card}>
      <h2>동일 산업 Growth Ranking</h2>
      <span className={styles.industry}>{comparison.industryName}</span>
      {comparison.rankings.length ? (
        <ol className={styles.ranking}>
          {comparison.rankings.map((row, index) => (
            <li key={row.companyId} className={`${row.rank <= 3 ? styles.topRank : ""} ${row.isCurrent ? styles.current : ""}`}>
              {index === 3 ? <span className={styles.ellipsis}>...</span> : null}
              <Link href={`/company/${row.companyId}`}>
                <span>{row.rank}</span>
                <strong>{formatCompanyDisplayName(row.companyName)}</strong>
                {row.isCurrent ? <Badge tone="blue">현재 기업</Badge> : null}
                <em>{row.growthScore.toFixed(1)}</em>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className={styles.empty}>동일 산업 Ranking을 계산할 수 없습니다.</p>
      )}
      <dl className={styles.stats}>
        <div><dt>산업 평균 Score</dt><dd>{comparison.averageScore ?? "-"}</dd></div>
        <div><dt>산업 최고 Score</dt><dd>{comparison.topScore ?? "-"}</dd></div>
      </dl>
    </Card>
  );
}
