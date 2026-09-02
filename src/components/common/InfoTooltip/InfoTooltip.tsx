import { Info } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";
import styles from "./InfoTooltip.module.css";

export function InfoTooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className={styles.wrap}>
      <button className={styles.trigger} type="button" aria-label={label}>
        <Info size={18} weight="duotone" />
      </button>
      <span className={styles.panel} role="tooltip">
        {children}
      </span>
    </span>
  );
}
