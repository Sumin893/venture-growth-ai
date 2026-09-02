import { Card } from "@/components/common/Card/Card";
import { Badge } from "@/components/common/Badge/Badge";
import { InfoTooltip } from "@/components/common/InfoTooltip/InfoTooltip";
import type { GrowthScore } from "@/types/company";
import styles from "./GrowthScoreCard.module.css";

export function GrowthScoreCard({ score }: { score: GrowthScore }) {
  const circumference = 2 * Math.PI * 82;
  const filled = Math.min(circumference, Math.max(0, (score.growthScore / 100) * circumference));
  return (
    <Card className={styles.card}>
      <div className={styles.title}>
        <h2>Growth Score</h2>
        <InfoTooltip label="Growth Score 설명">
          Growth Score는 재무 성장성, 특허·기술, 조직·고용, Growth Event, 산업·시장 등 5개 차원의 성장 신호를 종합하여 0~100점으로 산출한 성장 가능성 지표입니다.
          {score.isMock ? " 현재 화면의 점수는 서비스 검증용 Mock Score입니다." : ""}
        </InfoTooltip>
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
