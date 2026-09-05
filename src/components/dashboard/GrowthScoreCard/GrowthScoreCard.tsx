import { Card } from "@/components/common/Card/Card";
import { Badge } from "@/components/common/Badge/Badge";
import { InfoTooltip } from "@/components/common/InfoTooltip/InfoTooltip";
import type { GrowthScore } from "@/types/company";
import styles from "./GrowthScoreCard.module.css";

function formatTopPercentage(rank: number | null, total: number | null, percentile: number | null): string {
  if (rank !== null && total !== null && Number.isFinite(rank) && Number.isFinite(total) && rank > 0 && total > 0) {
    return `${Math.min(100, Math.max(1, Math.ceil((rank / total) * 100)))}%`;
  }

  if (percentile !== null && Number.isFinite(percentile)) {
    return `${Math.min(100, Math.max(1, Math.ceil(100 - percentile)))}%`;
  }

  return "-";
}

export function GrowthScoreCard({ score }: { score: GrowthScore }) {
  const circumference = 2 * Math.PI * 82;
  const filled = Math.min(circumference, Math.max(0, (score.growthScore / 100) * circumference));
  const overallTopPercentage = formatTopPercentage(score.growthRank, score.growthRankTotal, score.growthPercentile);
  const industryTopPercentage = formatTopPercentage(score.industryGrowthRank, score.industryGrowthRankTotal, score.industryGrowthPercentile);

  return (
    <Card className={styles.card}>
      <div className={styles.title}>
        <h2>Growth Score</h2>
        <InfoTooltip label="Growth Score 설명">
          Growth Score는 재무 성장성 30%, 특허·기술 20%, 조직·고용 20%, 뉴스·Growth Event 15%, 산업·시장 15%를 종합해 분석 대상 기업군 내 상대 성장 모멘텀을 나타내는 점수입니다.
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
          <strong>{overallTopPercentage}</strong>
          <span>동일 산업 상위</span>
          <strong>{industryTopPercentage}</strong>
          {score.isMock ? <Badge tone="blue">Mock {score.modelVersion}</Badge> : <Badge tone="green">Model {score.modelVersion}</Badge>}
        </div>
      </div>
    </Card>
  );
}
