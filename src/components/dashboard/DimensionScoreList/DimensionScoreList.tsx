import { ChartLineUp } from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/common/Card/Card";
import { categoryLabels } from "@/constants/labels";
import type { GrowthScore, ScoreCategory } from "@/types/company";
import styles from "./DimensionScoreList.module.css";

const dimensions: Array<[ScoreCategory, keyof GrowthScore]> = [
  ["financial", "financialScore"],
  ["patent", "patentScore"],
  ["employment", "employmentScore"],
  ["news_event", "newsEventScore"],
  ["industry", "industryScore"]
];

export function DimensionScoreList({ score }: { score: GrowthScore }) {
  return (
    <Card className={styles.card}>
      <h2>5대 성장 평가</h2>
      <div className={styles.list}>
        {dimensions.map(([category, key]) => {
              const value = Number(score[key]);
          return (
            <div key={category} className={styles.row}>
              <span className={styles.label}><ChartLineUp size={18} weight="duotone" />{categoryLabels[category]}</span>
              <progress className={styles.track} value={value} max={100} aria-label={`${categoryLabels[category]} ${value}점`} />
              <span className={styles.score}><strong>{value}</strong> / 100</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
