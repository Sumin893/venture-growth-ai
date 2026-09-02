import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/common/Badge/Badge";
import { Card } from "@/components/common/Card/Card";
import { InfoTooltip } from "@/components/common/InfoTooltip/InfoTooltip";
import type { DataConfidenceItem } from "@/types/company";
import styles from "./DataConfidenceCard.module.css";

interface DataConfidenceCardProps {
  items: DataConfidenceItem[];
  coverageScore: number;
}

export function DataConfidenceCard({ items, coverageScore }: DataConfidenceCardProps) {
  const coveragePercent = Math.round(coverageScore * 100);

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <h2>
          데이터 커버리지
          <InfoTooltip label="데이터 커버리지 설명">
            재무, 특허, 고용, 뉴스, 산업 영역의 평가 데이터 확보 수준을 나타냅니다.
          </InfoTooltip>
        </h2>
        <Badge tone="green">{coveragePercent}%</Badge>
      </div>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.label}>
            <CheckCircle size={22} weight="duotone" className={item.ok ? styles.ok : styles.dim} />
            <div>
              <strong>{item.label}</strong>
              <span>{item.value}</span>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
