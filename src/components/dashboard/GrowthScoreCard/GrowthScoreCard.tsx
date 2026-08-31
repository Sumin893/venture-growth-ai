import { Info } from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/common/Card/Card";
import { Badge } from "@/components/common/Badge/Badge";
import type { GrowthScore } from "@/types/company";
import styles from "./GrowthScoreCard.module.css";

export function GrowthScoreCard({ score }: { score: GrowthScore }) {
  const circumference = 2 * Math.PI * 82;
  const filled = Math.min(circumference, Math.max(0, (score.growthScore / 100) * circumference));
  return (
    <Card className={styles.card}>
      <div className={styles.title}>
        <h2>Growth Score</h2>
        <Info size={18} weight="duotone" />
      </div>
      <div className={styles.body}>
        <div className={styles.gauge}>
          <svg viewBox="0 0 190 190" aria-hidden="true">
            <circle className={styles.gaugeTrack} cx="95" cy="95" r="82" />
            <circle className={styles.gaugeValue} cx="95" cy="95" r="82" strokeDasharray={`${filled} ${circumference}`} />
          </svg>
          <strong>{score.growthScore.toFixed(1)}</strong>
          <span>/ 100</span>
        </div>
        <div className={styles.ranks}>
          <span>전체 상위</span>
          <strong>{score.growthPercentile}%</strong>
          <span>동일 산업 상위</span>
          <strong>{score.industryGrowthPercentile ?? "-"}%</strong>
          {score.isMock ? <Badge tone="blue">Mock {score.modelVersion}</Badge> : null}
        </div>
      </div>
    </Card>
  );
}
