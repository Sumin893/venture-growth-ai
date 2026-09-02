import Link from "next/link";
import { Badge } from "@/components/common/Badge/Badge";
import type { IndustryTopGroup } from "@/types/company";
import { formatCompanyDisplayName } from "@/utils/format";
import styles from "./IndustryTopSection.module.css";

export function IndustryTopSection({ groups }: { groups: IndustryTopGroup[] }) {
  return (
    <section className={styles.section} aria-labelledby="industry-top-title">
      <div className={styles.header}>
        <span>Industry Ranking</span>
        <h2 id="industry-top-title">산업군별 Growth Score TOP 5</h2>
      </div>
      <div className={styles.grid}>
        {groups.map((group) => (
          <article key={group.industryName} className={styles.card}>
            <h3>{group.industryName}</h3>
            {group.companies.length ? (
              <ol className={styles.list}>
                {group.companies.map((company) => (
                  <li key={company.companyId}>
                    <span className={styles.rank}>{company.rank}</span>
                    <Link href={`/company/${company.companyId}`}>{formatCompanyDisplayName(company.companyName)}</Link>
                    <strong>{company.growthScore.toFixed(1)}</strong>
                  </li>
                ))}
              </ol>
            ) : (
              <p className={styles.empty}>표시 가능한 점수가 없습니다.</p>
            )}
            {group.companies.some((company) => company.isMock) ? <Badge tone="blue">mock 포함</Badge> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
