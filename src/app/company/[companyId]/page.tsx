import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/common/Badge/Badge";
import { Header } from "@/components/layout/Header/Header";
import { DataConfidenceCard } from "@/components/dashboard/DataConfidenceCard/DataConfidenceCard";
import { DimensionScoreList } from "@/components/dashboard/DimensionScoreList/DimensionScoreList";
import { FeatureDetail } from "@/components/dashboard/FeatureDetail/FeatureDetail";
import { GrowthEventTimeline } from "@/components/dashboard/GrowthEventTimeline/GrowthEventTimeline";
import { GrowthScoreCard } from "@/components/dashboard/GrowthScoreCard/GrowthScoreCard";
import { IndustryComparison } from "@/components/dashboard/IndustryComparison/IndustryComparison";
import { SignalList } from "@/components/dashboard/SignalList/SignalList";
import { getDashboard } from "@/repositories/dashboardRepository";
import styles from "./page.module.css";

export default async function CompanyDashboard({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const dashboard = await getDashboard(Number(companyId));
  if (!dashboard) notFound();
  const { company, score } = dashboard;
  const coveragePercent = Math.round(score.coverageScore * 100);

  return (
    <main>
      <Header />
      <div className={styles.page}>
        <div className={styles.breadcrumb}><Link href="/">홈</Link><span>/</span><Link href="/">분석 대상 기업</Link><span>/</span><strong>{company.companyName}</strong></div>
        <div className={styles.companyHeader}>
          <div className={styles.mark}>{company.companyName.slice(0, 1)}</div>
          <div>
            <h1>{company.companyName}</h1>
            <div className={styles.meta}>
              <Badge tone="blue">{company.industry ?? "미분류"}</Badge>
              <Badge>{company.subIndustry ?? "세부 산업 없음"}</Badge>
              <span>업력 <strong>{company.companyAge ? `${company.companyAge.toFixed(1)}년` : "-"}</strong></span>
              <span>벤처 유형 <strong>{company.ventureType ?? "-"}</strong></span>
              <span>지역 <strong>{company.region ?? "-"}</strong></span>
              <Badge tone="green">데이터 커버리지 {coveragePercent}%</Badge>
            </div>
          </div>
        </div>
        <section className={styles.topGrid}>
          <GrowthScoreCard score={score} />
          <DimensionScoreList score={score} />
          <SignalList title="주요 성장 신호" type="positive" factors={dashboard.positiveFactors} />
          <SignalList title="주요 Risk 신호" type="negative" factors={dashboard.negativeFactors} />
        </section>
        <section className={styles.bottomGrid}>
          <FeatureDetail details={dashboard.featureDetails} />
          <IndustryComparison comparison={dashboard.industryComparison} />
          <GrowthEventTimeline events={dashboard.growthEvents} />
          <DataConfidenceCard items={dashboard.dataConfidence} coverageScore={score.coverageScore} />
        </section>
        <footer className={styles.footer}>Growth Score 및 지표는 내부 알고리즘과 공공 데이터를 기반으로 산출되며, 투자 권유가 아닙니다.</footer>
      </div>
    </main>
  );
}
