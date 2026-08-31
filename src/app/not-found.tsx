import Link from "next/link";
import { Header } from "@/components/layout/Header/Header";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <main>
      <Header />
      <section className={styles.wrap}>
        <h1>분석 대상 기업을 찾을 수 없습니다.</h1>
        <p>현재 MVP에서는 사전 분석된 300개 혁신·벤처기업을 대상으로 성장성 평가를 제공합니다.</p>
        <Link href="/">검색으로 돌아가기</Link>
      </section>
    </main>
  );
}
