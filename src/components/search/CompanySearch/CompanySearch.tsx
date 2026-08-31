"use client";

import Link from "next/link";
import { ArrowRight, MagnifyingGlass } from "@phosphor-icons/react";
import { useCompanySearch } from "@/hooks/useCompanySearch";
import styles from "./CompanySearch.module.css";

export function CompanySearch() {
  const { query, setQuery, results, loading, error } = useCompanySearch();
  const hasQuery = query.trim().length > 0;
  const canShowResults = query.trim().length >= 2;
  const showEmpty = canShowResults && !loading && !error && results.length === 0;

  return (
    <div className={styles.wrap} id="companies">
      <label className={styles.searchBox}>
        <MagnifyingGlass size={25} weight="duotone" aria-hidden />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="300개 분석 기업 중 검색"
          aria-label="기업명 검색"
        />
        <button type="button" title="검색">
          <SearchGlyph />
        </button>
      </label>
      {hasQuery ? (
        <div className={styles.results}>
          {!canShowResults ? <p className={styles.state}>두 글자 이상 입력해 주세요.</p> : null}
          {canShowResults && loading ? <p className={styles.state}>검색 중입니다.</p> : null}
          {canShowResults && error ? <p className={styles.state}>{error}</p> : null}
          {canShowResults && !loading && !error && results.map((company) => (
            <Link key={company.companyId} href={`/company/${company.companyId}`} className={styles.result}>
              <span className={styles.avatar}>{company.companyName.slice(0, 1)}</span>
              <strong>{company.companyName}</strong>
              <span className={styles.industry}>{company.industry ?? "미분류"}</span>
              <span className={styles.action}>분석 보기 <ArrowRight size={18} weight="bold" /></span>
            </Link>
          ))}
          {showEmpty ? (
            <div className={styles.empty}>
              <strong>현재 분석 준비 중인 기업입니다.</strong>
              <span>현재 MVP에서는 사전 분석된 300개 혁신·벤처기업을 대상으로 성장성 평가를 제공합니다.</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function SearchGlyph() {
  return (
    <svg className={styles.searchGlyph} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="10.5" cy="10.5" r="6.25" />
      <path d="M15.25 15.25L20 20" />
    </svg>
  );
}
