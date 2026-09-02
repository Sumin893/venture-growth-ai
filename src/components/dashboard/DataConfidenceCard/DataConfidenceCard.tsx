import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/common/Badge/Badge";
import { Card } from "@/components/common/Card/Card";
import { InfoTooltip } from "@/components/common/InfoTooltip/InfoTooltip";
import type { DataConfidenceItem } from "@/types/company";
import styles from "./DataConfidenceCard.module.css";

export function DataConfidenceCard({ items }: { items: DataConfidenceItem[] }) {
  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <h2>
          Data Confidence
          <InfoTooltip label="Data Confidence 설명">
            Data Confidence는 해당 기업의 재무, 특허, 고용, 뉴스 등 평가 데이터의 확보 범위와 관측 가능성을 기준으로 평가 결과의 데이터 충분도를 나타냅니다.
          </InfoTooltip>
        </h2>
        <Badge tone="green">A</Badge>
      </div>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.label}>
            <CheckCircle size={22} weight="duotone" className={item.ok ? styles.ok : styles.dim} />
            <div><strong>{item.label}</strong><span>{item.value}</span></div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
