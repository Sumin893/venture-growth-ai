import { CheckCircle, TrendUp, Warning } from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/common/Card/Card";
import { featureMetadata } from "@/constants/featureMetadata";
import type { GrowthScoreFactor } from "@/types/company";
import styles from "./SignalList.module.css";

interface SignalListProps {
  title: string;
  type: "positive" | "negative";
  factors: GrowthScoreFactor[];
}

export function SignalList({ title, type, factors }: SignalListProps) {
  const Icon = type === "positive" ? TrendUp : Warning;
  return (
    <Card className={styles.card}>
      <h2 className={type === "positive" ? styles.positiveTitle : styles.negativeTitle}>
        <Icon size={23} weight="duotone" /> {title}
      </h2>
      {factors.length ? (
        <ul className={styles.list}>
          {factors.map((factor) => (
            <li key={`${factor.category}-${factor.featureName}`}>
              <CheckCircle className={type === "positive" ? styles.positive : styles.negative} size={21} weight="duotone" />
              <div>
                <strong>{featureMetadata[factor.featureName]?.label ?? factor.featureName}</strong>
                <span>{factor.description}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>표시할 신호가 아직 충분하지 않습니다.</p>
      )}
    </Card>
  );
}
