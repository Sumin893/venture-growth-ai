import { Header } from "@/components/layout/Header/Header";
import styles from "./HomeLoadingSkeleton.module.css";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`${styles.skeleton} ${className}`} />;
}

export function HomeLoadingSkeleton() {
  return (
    <main className={styles.page}>
      <Header />
      <div aria-busy="true" data-loading-kind="home" aria-label="홈 화면 로딩 중">
        <section className={styles.hero}>
          <div className={styles.bubbleLayer}>
            {Array.from({ length: 12 }).map((_, index) => (
              <div className={`${styles.bubble} ${styles[`bubble${index}`] ?? ""}`} key={index}>
                <Skeleton className={styles.bubbleMark} />
                <Skeleton className={styles.bubbleText} />
              </div>
            ))}
          </div>

          <div className={styles.copy}>
            <div className={styles.title}>
              <Skeleton className={`${styles.wFull} ${styles.h50} ${styles.block}`} />
              <Skeleton className={`${styles.wFull} ${styles.h50} ${styles.block}`} />
            </div>
            <Skeleton className={`${styles.description} ${styles.block}`} />
            <div className={styles.search}>
              <Skeleton className={styles.searchLine} />
              <Skeleton className={`${styles.searchButton} ${styles.block}`} />
            </div>
          </div>
        </section>

        <section className={styles.industrySection}>
          <div className={styles.sectionHeader}>
            <Skeleton className={`${styles.w120} ${styles.h14}`} />
            <Skeleton className={`${styles.w320} ${styles.h36} ${styles.block}`} />
          </div>
          <div className={styles.industryGrid}>
            {Array.from({ length: 6 }).map((_, cardIndex) => (
              <article className={styles.card} key={cardIndex}>
                <Skeleton className={`${styles.w160} ${styles.h20}`} />
                <div className={styles.rankRows}>
                  {Array.from({ length: 5 }).map((_, rowIndex) => (
                    <div className={styles.rankRow} key={rowIndex}>
                      <Skeleton className={styles.rankBadge} />
                      <Skeleton className={`${styles.wFull} ${styles.h18}`} />
                      <Skeleton className={`${styles.w72} ${styles.h18}`} />
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.featureBand}>
          {Array.from({ length: 3 }).map((_, index) => (
            <section className={styles.featureCard} key={index}>
              <Skeleton className={styles.featureIcon} />
              <div className={styles.featureText}>
                <Skeleton className={`${styles.w160} ${styles.h24}`} />
                <Skeleton className={`${styles.wFull} ${styles.h14}`} />
              </div>
            </section>
          ))}
        </section>
      </div>
    </main>
  );
}
