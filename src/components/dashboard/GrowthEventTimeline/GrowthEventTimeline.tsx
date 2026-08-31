import { ArrowUpRight, CalendarDots } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/common/Badge/Badge";
import { Card } from "@/components/common/Card/Card";
import type { GrowthEvent } from "@/types/company";
import { compactDate } from "@/utils/format";
import styles from "./GrowthEventTimeline.module.css";

export function GrowthEventTimeline({ events }: { events: GrowthEvent[] }) {
  return (
    <Card className={styles.card}>
      <h2>Growth Event 타임라인</h2>
      {events.length ? (
        <ol className={styles.timeline}>
          {events.map((event) => (
            <li key={event.eventId}>
              <time dateTime={event.publishedAt}>{compactDate(event.publishedAt)}</time>
              <div className={styles.badges}>
                <Badge tone="blue">{event.eventType}</Badge>
                <Badge tone={event.eventDirection === "positive" ? "green" : event.eventDirection === "negative" ? "red" : "neutral"}>
                  {event.eventDirection}
                </Badge>
              </div>
              {event.href ? (
                <a href={event.href} target="_blank" rel="noreferrer noopener">
                  {event.newsTitle}
                  <ArrowUpRight size={15} weight="bold" />
                </a>
              ) : (
                <strong>{event.newsTitle}</strong>
              )}
              <p>{event.eventSummary ?? "요약 정보가 없습니다."}</p>
              <span>{event.sourceDomain ?? "출처 확인 불가"}</span>
            </li>
          ))}
        </ol>
      ) : (
        <div className={styles.empty}>
          <CalendarDots size={32} weight="duotone" />
          <strong>표시 가능한 Growth Event가 없습니다.</strong>
          <span>유효성 조건을 통과한 원천 뉴스 이벤트가 있을 때 최신순으로 표시됩니다.</span>
        </div>
      )}
    </Card>
  );
}
