import { ChartLineUp } from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/common/Card/Card";
import { categoryLabels } from "@/constants/labels";
import type { GrowthScore, ScoreCategory } from "@/types/company";
import styles from "./DimensionScoreList.module.css";

const dimensions: Array<[ScoreCategory, keyof GrowthScore, keyof GrowthScore]> = [
  ["financial", "financialScore", "financialDataAvailable"],
  ["patent", "patentScore", "patentDataAvailable"],
  ["employment", "employmentScore", "employmentDataAvailable"],
  ["news_event", "newsEventScore", "newsEventDataAvailable"],
  ["industry", "industryScore", "industryDataAvailable"]
];

export function DimensionScoreList({ score }: { score: GrowthScore }) {
  return (
    <Card className={styles.card}>
      <h2>5대 성장 평가</h2>
      <div className={styles.list}>
        {dimensions.map(([category, scoreKey, availabilityKey]) => {
          const value = score[scoreKey] as number | null;
          const available = score[availabilityKey] as boolean;
          const unavailableText = available ? "유효 데이터 부족" : "데이터 없음";

          return (
            <div key={category} className={`${styles.row} ${value === null ? styles.unavailable : ""}`}>
              <span className={styles.label}>
                <ChartLineUp size={18} weight="duotone" />
                {categoryLabels[category]}
              </span>
              {value === null ? (
                <div className={styles.emptyTrack} aria-label={`${categoryLabels[category]} ${unavailableText}`} />
              ) : (
                <progress className={styles.track} value={value} max={100} aria-label={`${categoryLabels[category]} ${value}점`} />
              )}
              <span className={styles.score}>
                {value === null ? unavailableText : <><strong>{Math.round(value)}</strong> / 100</>}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
