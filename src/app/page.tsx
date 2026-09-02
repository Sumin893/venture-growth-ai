import { ChartBar, FileText, Gauge } from "@phosphor-icons/react/dist/ssr";
import { Header } from "@/components/layout/Header/Header";
import { CompanySearch } from "@/components/search/CompanySearch/CompanySearch";
import { CompanyBubbleCloud } from "@/components/search/CompanyBubbleCloud/CompanyBubbleCloud";
import { IndustryTopSection } from "@/components/home/IndustryTopSection/IndustryTopSection";
import { Card } from "@/components/common/Card/Card";
import { getFeaturedCompanies } from "@/repositories/companyRepository";
import { getIndustryTopGroups } from "@/repositories/dashboardRepository";
import styles from "./page.module.css";

export default async function Home() {
  const [companies, industryTopGroups] = await Promise.all([getFeaturedCompanies(30), getIndustryTopGroups(5)]);
  return (
    <main>
      <Header />
      <section className={styles.hero} id="service">
        <CompanyBubbleCloud companies={companies} />
        <div className={styles.copy}>
          <h1>
            <span className={styles.line}>혁신기업의 미래 성장 가능성을</span>
            <span className={styles.accent}>데이터로 발견합니다.</span>
          </h1>
          <p>재무·특허·고용·성장 이벤트·산업 데이터를 종합하여 기업의 미래 성장 가능성을 분석합니다.</p>
          <CompanySearch />
        </div>
      </section>
      <IndustryTopSection groups={industryTopGroups} />
      <section className={styles.featureBand}>
        <Card className={styles.featureCard}>
          <Gauge size={54} weight="duotone" />
          <div><h2>Growth Score</h2><p>다차원 데이터를 기반으로 미래 성장 가능성을 숫자로 제공합니다.</p></div>
        </Card>
        <Card className={styles.featureCard}>
          <ChartBar size={54} weight="duotone" />
          <div><h2>산업 내 비교</h2><p>동일 산업 내 상대적 위치와 경쟁력을 직관적으로 파악합니다.</p></div>
        </Card>
        <Card className={styles.featureCard}>
          <FileText size={54} weight="duotone" />
          <div><h2>평가 근거 제공</h2><p>평가에 활용된 핵심 데이터와 신뢰도 정보를 함께 제공합니다.</p></div>
        </Card>
      </section>
    </main>
  );
}
