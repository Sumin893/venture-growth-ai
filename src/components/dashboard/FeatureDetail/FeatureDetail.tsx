"use client";

import { useState } from "react";
import { categoryLabels } from "@/constants/labels";
import { categoryDescriptions } from "@/constants/featureMetadata";
import type { DashboardData, ScoreCategory } from "@/types/company";
import { Card } from "@/components/common/Card/Card";
import styles from "./FeatureDetail.module.css";

const tabs: ScoreCategory[] = ["financial", "patent", "employment", "news_event", "industry"];

export function FeatureDetail({ details }: { details: DashboardData["featureDetails"] }) {
  const [active, setActive] = useState<ScoreCategory>("financial");
  const rows = details[active] ?? [];
  return (
    <Card className={styles.card}>
      <div className={styles.tabs} role="tablist" aria-label="Feature 상세">
        {tabs.map((tab) => (
          <button key={tab} type="button" onClick={() => setActive(tab)} className={active === tab ? styles.active : ""}>
            {categoryLabels[tab]}
          </button>
        ))}
      </div>
      <p className={styles.description}>{categoryDescriptions[active]}</p>
      {rows.length ? (
        <table className={styles.table}>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row"><span>{row.label}</span><small>{row.description}</small></th>
                <td>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className={styles.empty}>표시 가능한 상세 지표가 아직 없습니다.</p>
      )}
    </Card>
  );
}
