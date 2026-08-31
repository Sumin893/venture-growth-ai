import Link from "next/link";
import type { CompanySummary } from "@/types/company";
import styles from "./CompanyBubbleCloud.module.css";

export function CompanyBubbleCloud({ companies }: { companies: CompanySummary[] }) {
  return (
    <div className={styles.cloud} aria-label="분석 대상 기업 예시">
      {companies.slice(0, 30).map((company, index) => (
        <Link
          key={company.companyId}
          href={`/company/${company.companyId}`}
          className={`${styles.bubble} ${styles[`bubble${index}`] ?? ""}`}
        >
          <span>{company.companyName.slice(0, 1)}</span>
          <strong>{company.companyName}</strong>
        </Link>
      ))}
    </div>
  );
}
