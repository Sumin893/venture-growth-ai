import { CheckCircle, Info } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/common/Badge/Badge";
import { Card } from "@/components/common/Card/Card";
import type { DataConfidenceItem } from "@/types/company";
import styles from "./DataConfidenceCard.module.css";

export function DataConfidenceCard({ items }: { items: DataConfidenceItem[] }) {
  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <h2>Data Confidence <Info size={16} weight="duotone" /></h2>
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
