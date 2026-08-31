import Link from "next/link";
import styles from "./Header.module.css";

export function Header() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label="Growth AI 홈">
        <span className={styles.logo}>G</span>
        <span>Growth AI</span>
      </Link>
      <nav className={styles.nav} aria-label="주요 메뉴">
        <a href="#service">서비스 소개</a>
        <a href="#companies">분석 대상 기업</a>
      </nav>
    </header>
  );
}
