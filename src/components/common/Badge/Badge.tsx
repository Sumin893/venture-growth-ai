import styles from "./Badge.module.css";

interface BadgeProps {
  children: React.ReactNode;
  tone?: "blue" | "green" | "red" | "neutral";
}

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}
