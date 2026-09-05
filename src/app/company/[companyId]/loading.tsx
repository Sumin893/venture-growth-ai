import { Header } from "@/components/layout/Header/Header";
import styles from "./loading.module.css";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`${styles.skeleton} ${className}`} />;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`${styles.card} ${className}`}>{children}</section>;
}

function SignalSkeleton() {
  return (
    <Card className={styles.smallCard}>
      <Skeleton className={`${styles.w150} ${styles.h22}`} />
      <div className={styles.list}>
        {Array.from({ length: 3 }).map((_, index) => (
          <div className={styles.listItem} key={index}>
            <Skeleton className={`${styles.dot}`} />
            <div className={styles.stack}>
              <Skeleton className={`${styles.w180} ${styles.h18}`} />
              <Skeleton className={`${styles.wFull} ${styles.h12}`} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function CompanyDashboardLoading() {
  return (
    <main>
      <Header />
      <div className={styles.page} aria-busy="true" data-loading-kind="company" aria-label="기업 상세 대시보드 로딩 중">
        <div className={styles.breadcrumb}>
          <Skeleton className={`${styles.w40} ${styles.h14}`} />
          <Skeleton className={`${styles.w8} ${styles.h14}`} />
          <Skeleton className={`${styles.w120} ${styles.h14}`} />
          <Skeleton className={`${styles.w8} ${styles.h14}`} />
          <Skeleton className={`${styles.w150} ${styles.h14}`} />
        </div>

        <div className={styles.companyHeader}>
          <Skeleton className={`${styles.w74} ${styles.h74} ${styles.circle}`} />
          <div className={styles.headerText}>
            <Skeleton className={`${styles.w320} ${styles.h36} ${styles.block}`} />
            <div className={styles.meta}>
              <Skeleton className={`${styles.w86} ${styles.h28}`} />
              <Skeleton className={`${styles.w120} ${styles.h28}`} />
              <Skeleton className={`${styles.w72} ${styles.h18}`} />
              <Skeleton className={`${styles.w96} ${styles.h18}`} />
              <Skeleton className={`${styles.w72} ${styles.h18}`} />
              <Skeleton className={`${styles.w150} ${styles.h28}`} />
            </div>
          </div>
        </div>

        <section className={styles.topGrid}>
          <Card className={styles.largeCard}>
            <Skeleton className={`${styles.w180} ${styles.h28} ${styles.block}`} />
            <div className={styles.scoreBody}>
              <div className={styles.gauge} />
              <div className={styles.stack}>
                <Skeleton className={`${styles.w96} ${styles.h14}`} />
                <Skeleton className={`${styles.w86} ${styles.h36} ${styles.block}`} />
                <Skeleton className={`${styles.w120} ${styles.h14}`} />
                <Skeleton className={`${styles.w86} ${styles.h36} ${styles.block}`} />
                <Skeleton className={`${styles.w96} ${styles.h28}`} />
              </div>
            </div>
          </Card>

          <Card className={styles.largeCard}>
            <Skeleton className={`${styles.w180} ${styles.h22}`} />
            <div className={styles.bars}>
              {Array.from({ length: 5 }).map((_, index) => (
                <div className={styles.barRow} key={index}>
                  <Skeleton className={`${styles.w120} ${styles.h18}`} />
                  <Skeleton className={`${styles.wFull} ${styles.h8}`} />
                  <Skeleton className={`${styles.w56} ${styles.h18}`} />
                </div>
              ))}
            </div>
          </Card>

          <SignalSkeleton />
          <SignalSkeleton />
        </section>

        <section className={styles.bottomGrid}>
          <Card className={styles.bottomCard}>
            <div className={styles.tabs}>
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton className={`${styles.tab} ${styles.block}`} key={index} />
              ))}
            </div>
            <Skeleton className={`${styles.wFull} ${styles.h18} ${styles.block}`} />
            <div className={styles.table}>
              {Array.from({ length: 4 }).map((_, index) => (
                <div className={styles.tableRow} key={index}>
                  <div className={styles.tableCell}>
                    <Skeleton className={`${styles.w180} ${styles.h18}`} />
                  </div>
                  <div className={styles.tableCell}>
                    <Skeleton className={`${styles.w86} ${styles.h18}`} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className={styles.bottomCard}>
            <Skeleton className={`${styles.w180} ${styles.h22}`} />
            <div className={styles.list}>
              {Array.from({ length: 4 }).map((_, index) => (
                <div className={styles.row} key={index}>
                  <Skeleton className={`${styles.w24} ${styles.h22}`} />
                  <Skeleton className={`${styles.wFull} ${styles.h18}`} />
                  <Skeleton className={`${styles.w56} ${styles.h18}`} />
                </div>
              ))}
            </div>
          </Card>

          <Card className={styles.bottomCard}>
            <Skeleton className={`${styles.w180} ${styles.h22}`} />
            <div className={styles.timeline}>
              {Array.from({ length: 4 }).map((_, index) => (
                <div className={styles.timelineItem} key={index}>
                  <Skeleton className={styles.dot} />
                  <div className={styles.stack}>
                    <Skeleton className={`${styles.w120} ${styles.h14}`} />
                    <Skeleton className={`${styles.wFull} ${styles.h18}`} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className={styles.bottomCard}>
            <Skeleton className={`${styles.w180} ${styles.h22}`} />
            <div className={styles.bars}>
              {Array.from({ length: 5 }).map((_, index) => (
                <div className={styles.row} key={index}>
                  <Skeleton className={`${styles.w96} ${styles.h18}`} />
                  <Skeleton className={`${styles.wFull} ${styles.h8}`} />
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}
