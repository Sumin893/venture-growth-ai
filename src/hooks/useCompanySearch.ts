"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchCompanies } from "@/services/companyApi";
import type { CompanySummary } from "@/types/company";

export function useCompanySearch(initialQuery = "") {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<CompanySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    let active = true;
    const handle = window.setTimeout(async () => {
      if (trimmedQuery.length > 0 && trimmedQuery.length < 2) return;
      setLoading(true);
      setError(null);
      try {
        const companies = await fetchCompanies(trimmedQuery);
        if (active) setResults(companies);
      } catch (searchError) {
        if (active) setError(searchError instanceof Error ? searchError.message : "검색 오류가 발생했습니다.");
      } finally {
        if (active) setLoading(false);
      }
    }, 180);

    return () => {
      active = false;
      window.clearTimeout(handle);
    };
  }, [trimmedQuery]);

  return { query, setQuery, results, loading, error };
}
